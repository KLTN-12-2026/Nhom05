import pako from 'pako';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// [GIẢI THÍCH CODE]: Cấu trúc chương / trang của sách hiển thị trong trình đọc
export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  content: string[];
}

// Bảng tra cứu Base64 O(1) tốc độ cao cho React Native Hermes
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < B64_CHARS.length; i++) {
  B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

// [GIẢI THÍCH CODE]: Giải mã Base64 sang Uint8Array thuần JavaScript
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  if (len === 0) return new Uint8Array(0);

  const bytes = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const e1 = B64_LOOKUP[clean.charCodeAt(i)];
    const e2 = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const e3 = i + 2 < len && clean[i + 2] !== '=' ? B64_LOOKUP[clean.charCodeAt(i + 2)] : 64;
    const e4 = i + 3 < len && clean[i + 3] !== '=' ? B64_LOOKUP[clean.charCodeAt(i + 3)] : 64;

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== 64) {
      bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    }
    if (e4 !== 64) {
      bytes[p++] = ((e3 & 3) << 6) | e4;
    }
  }

  return bytes.subarray(0, p);
}

// [GIẢI THÍCH CODE]: Đọc tệp PDF từ URI thành mảng byte Uint8Array
async function getPdfUint8Array(fileUri: string): Promise<Uint8Array> {
  if (!fileUri) return new Uint8Array(0);

  // 1. Trên Web hoặc URL http/https/blob/data
  if (
    Platform.OS === 'web' ||
    fileUri.startsWith('http://') ||
    fileUri.startsWith('https://') ||
    fileUri.startsWith('blob:') ||
    fileUri.startsWith('data:')
  ) {
    try {
      const res = await fetch(fileUri);
      const ab = await res.arrayBuffer();
      return new Uint8Array(ab);
    } catch (e) {
      console.warn('[PDF] Fetch web URI warning:', e);
      return new Uint8Array(0);
    }
  }

  // 2. Trên Mobile Native (iOS / Android): Sử dụng FileSystem của Expo
  let uriToRead = fileUri;
  try {
    uriToRead = decodeURI(fileUri);
  } catch {}

  try {
    const base64 = await FileSystem.readAsStringAsync(uriToRead, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToUint8Array(base64);
  } catch (fsErr) {
    console.warn('[PDF] FileSystem đọc lần 1 thất bại, thử lại URI gốc:', fsErr);
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64ToUint8Array(base64);
    } catch (fsErr2) {
      console.warn('[PDF] FileSystem đọc lần 2 thất bại, thử fetch fallback:', fsErr2);
      try {
        const res = await fetch(fileUri);
        const ab = await res.arrayBuffer();
        return new Uint8Array(ab);
      } catch {
        return new Uint8Array(0);
      }
    }
  }
}

// [GIẢI THÍCH CODE]: Giải mã chuỗi trong ngoặc đơn PDF (xử lý escape ký tự, mã bát phân, UTF-16BE)
function decodeParenString(str: string): string {
  if (!str) return '';

  if (str.startsWith('\xfe\xff') || str.startsWith('\\376\\377')) {
    const clean = str.replace(/^(\xfe\xff|\\376\\377)/, '');
    let res = '';
    for (let i = 0; i < clean.length; i += 2) {
      const code = (clean.charCodeAt(i) << 8) | clean.charCodeAt(i + 1);
      res += String.fromCharCode(code);
    }
    return res.trim();
  }

  return str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

// [GIẢI THÍCH CODE]: Phân tích toàn diện các bảng ToUnicode CMap để dịch glyph sang Unicode chuẩn
function parseAllCMaps(streams: string[]): Map<string, string> {
  const cmap = new Map<string, string>();
  const charRegex = /beginbfchar([\s\S]*?)endbfchar/g;
  const rangeRegex = /beginbfrange([\s\S]*?)endbfrange/g;

  for (const stream of streams) {
    if (!stream.includes('beginbfchar') && !stream.includes('beginbfrange')) continue;

    // 1. beginbfchar
    let cm: RegExpExecArray | null;
    while ((cm = charRegex.exec(stream)) !== null) {
      const lineRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
      let lm: RegExpExecArray | null;
      while ((lm = lineRegex.exec(cm[1])) !== null) {
        const src = lm[1].toLowerCase();
        const dstHex = lm[2];
        let dstStr = '';
        for (let i = 0; i < dstHex.length; i += 4) {
          const code = parseInt(dstHex.substr(i, 4), 16);
          if (!isNaN(code) && code > 0) dstStr += String.fromCharCode(code);
        }
        if (!dstStr && dstHex.length === 2) {
          dstStr = String.fromCharCode(parseInt(dstHex, 16));
        }
        if (dstStr) cmap.set(src, dstStr);
      }
    }

    // 2. beginbfrange
    let rm: RegExpExecArray | null;
    while ((rm = rangeRegex.exec(stream)) !== null) {
      const lineRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
      let rlm: RegExpExecArray | null;
      while ((rlm = lineRegex.exec(rm[1])) !== null) {
        const startCode = parseInt(rlm[1], 16);
        const endCode = parseInt(rlm[2], 16);
        let dstCode = parseInt(rlm[3], 16);
        const padLen = rlm[1].length;
        for (let c = startCode; c <= endCode; c++, dstCode++) {
          const key = c.toString(16).padStart(padLen, '0').toLowerCase();
          cmap.set(key, String.fromCharCode(dstCode));
        }
      }
    }
  }

  return cmap;
}

// [GIẢI THÍCH CODE]: Giải mã chuỗi Hex dựa vào bảng CMap hoặc giải mã trực tiếp UTF-16BE / ASCII
function decodeHex(hex: string, cmap: Map<string, string>): string {
  const clean = hex.replace(/[\s\r\n]/g, '').toLowerCase();
  if (!clean) return '';

  let str = '';
  const has2 = Array.from(cmap.keys()).some((k) => k.length === 2);
  const step = has2 && clean.length % 2 === 0 ? 2 : clean.length % 4 === 0 ? 4 : 2;

  for (let i = 0; i < clean.length; i += step) {
    const part = clean.substr(i, step);
    if (cmap.has(part)) {
      str += cmap.get(part);
    } else {
      const code = parseInt(part, 16);
      if (!isNaN(code) && code > 0) {
        str += String.fromCharCode(code);
      }
    }
  }

  return str;
}

// [GIẢI THÍCH CODE]: Trích xuất văn bản từ toàn bộ tệp PDF với độ chính xác byte tuyệt đối
export function extractTextFromPdfUint8Array(uint8: Uint8Array): string[][] {
  if (uint8.length === 0) return [];

  // Chuyển Uint8Array sang chuỗi nhị phân bảo toàn byte 0-255 (latin1)
  let binaryStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const slice = uint8.subarray(i, i + chunkSize);
    binaryStr += String.fromCharCode(...slice);
  }

  // 1. Thu thập chính xác vị trí bắt đầu và kết thúc từng stream
  const decompressedStreams: string[] = [];
  let pos = 0;
  let sIdx: number;

  while ((sIdx = binaryStr.indexOf('stream', pos)) !== -1) {
    // Đảm bảo là từ khóa 'stream' độc lập
    if (sIdx > 0 && /[a-zA-Z]/.test(binaryStr[sIdx - 1])) {
      pos = sIdx + 6;
      continue;
    }

    let start = sIdx + 6;
    if (binaryStr[start] === '\r' && binaryStr[start + 1] === '\n') {
      start += 2;
    } else if (binaryStr[start] === '\n' || binaryStr[start] === '\r') {
      start += 1;
    }

    const eIdx = binaryStr.indexOf('endstream', start);
    if (eIdx === -1) break;

    let end = eIdx;
    // Bỏ qua delimiter CRLF / LF ngay trước endstream
    if (binaryStr[end - 1] === '\n') {
      end--;
      if (binaryStr[end - 1] === '\r') end--;
    } else if (binaryStr[end - 1] === '\r') {
      end--;
    }

    const streamBytes = uint8.subarray(start, end);
    let dec = '';

    try {
      dec = new TextDecoder('latin1').decode(pako.inflate(streamBytes));
    } catch {
      try {
        dec = new TextDecoder('latin1').decode(pako.inflateRaw(streamBytes));
      } catch {
        dec = binaryStr.slice(start, end);
      }
    }

    decompressedStreams.push(dec);
    pos = eIdx + 9;
  }

  // 2. Thu thập bảng CMap từ tất cả các stream và toàn bộ nội dung PDF
  const cmap = parseAllCMaps([...decompressedStreams, binaryStr]);

  // 3. Trích xuất các dòng văn bản từ các stream chứa khối văn bản BT...ET
  const rawPages: string[][] = [];

  for (const stream of decompressedStreams) {
    if (!stream.includes('BT') && !stream.includes('Tj') && !stream.includes('TJ')) {
      continue;
    }

    const lines: string[] = [];
    let curLine = '';

    // Khớp các toán tử hiển thị văn bản và di chuyển dòng trong PDF
    const opRegex =
      /BT|ET|T\*|(?:\((?:\\\(|\\\)|[^)])*\)|<[0-9a-fA-F\s]+>)\s*Tj|\[([\s\S]*?)\]\s*TJ|[-+]?[0-9]*\.?[0-9]+\s+[-+]?[0-9]*\.?[0-9]+\s+Td/g;
    let om: RegExpExecArray | null;

    while ((om = opRegex.exec(stream)) !== null) {
      const op = om[0];

      if (op === 'BT' || op === 'ET' || op === 'T*') {
        if (curLine.trim().length > 0) {
          lines.push(curLine.trim());
          curLine = '';
        }
      } else if (op.endsWith('Td')) {
        const parts = op.split(/\s+/);
        const dy = parseFloat(parts[1]);
        if (Math.abs(dy) > 2) {
          if (curLine.trim().length > 0) {
            lines.push(curLine.trim());
            curLine = '';
          }
        }
      } else if (op.endsWith('Tj')) {
        let text = '';
        if (op.startsWith('(')) {
          const pm = op.match(/\(([\s\S]*)\)\s*Tj/);
          if (pm) text = decodeParenString(pm[1]);
        } else if (op.startsWith('<')) {
          const hm = op.match(/<([0-9a-fA-F\s]+)>\s*Tj/);
          if (hm) text = decodeHex(hm[1], cmap);
        }
        if (text) curLine += text;
      } else if (op.endsWith('TJ')) {
        const inner = om[1];
        const tokenRegex = /\((?:\\\(|\\\)|[^)])*\)|<[0-9a-fA-F\s]+>|[-+]?[0-9]*\.?[0-9]+/g;
        let tm: RegExpExecArray | null;

        while ((tm = tokenRegex.exec(inner)) !== null) {
          const t = tm[0];
          if (t.startsWith('(')) {
            curLine += decodeParenString(t.slice(1, -1));
          } else if (t.startsWith('<')) {
            curLine += decodeHex(t.slice(1, -1), cmap);
          } else {
            const num = parseFloat(t);
            if (!isNaN(num) && num < -80 && curLine.length > 0 && !curLine.endsWith(' ')) {
              curLine += ' ';
            }
          }
        }
      }
    }

    if (curLine.trim().length > 0) {
      lines.push(curLine.trim());
    }

    if (lines.length > 0) {
      // Gom nhóm các dòng thành đoạn văn
      const paragraphs: string[] = [];
      let curPara = '';

      for (const line of lines) {
        if (!curPara) {
          curPara = line;
        } else if (
          line.endsWith('.') ||
          line.endsWith('!') ||
          line.endsWith('?') ||
          line.endsWith(':') ||
          curPara.length > 250
        ) {
          curPara += ' ' + line;
          paragraphs.push(curPara.trim());
          curPara = '';
        } else {
          curPara += ' ' + line;
        }
      }

      if (curPara.trim()) {
        paragraphs.push(curPara.trim());
      }

      if (paragraphs.length > 0) {
        rawPages.push(paragraphs);
      }
    }
  }

  // 4. Fallback trực tiếp: Quét toàn bộ nhị phân nếu các stream không có BT...ET
  if (rawPages.length === 0) {
    const directLines: string[] = [];
    const directTjRegex = /\(([^()]{3,200})\)\s*Tj/g;
    let dMatch: RegExpExecArray | null;
    while ((dMatch = directTjRegex.exec(binaryStr)) !== null) {
      const t = decodeParenString(dMatch[1]);
      if (t && t.length > 3 && !t.includes('%PDF') && !t.includes('obj') && !t.includes('endobj')) {
        directLines.push(t);
      }
    }
    if (directLines.length > 0) {
      rawPages.push(directLines);
    }
  }

  return rawPages;
}

// [GIẢI THÍCH CODE]: Chia nhỏ trang văn bản quá dài thành các trang đọc vừa mắt
function paginateLongText(pages: string[][]): string[][] {
  const result: string[][] = [];

  for (const page of pages) {
    const totalChars = page.reduce((sum, p) => sum + p.length, 0);
    if (totalChars <= 1800) {
      result.push(page);
    } else {
      let curPage: string[] = [];
      let curCount = 0;

      for (const para of page) {
        if (curCount + para.length > 1500 && curPage.length > 0) {
          result.push(curPage);
          curPage = [para];
          curCount = para.length;
        } else {
          curPage.push(para);
          curCount += para.length;
        }
      }

      if (curPage.length > 0) {
        result.push(curPage);
      }
    }
  }

  return result.length > 0 ? result : pages;
}

// [GIẢI THÍCH CODE]: Hàm chính chuyển đổi tệp PDF tải lên thành các chương sách để hiển thị trong ManHinhDoc
export async function extractPdfChapters(
  fileUri: string,
  fileName: string,
  bookTitle: string,
  author: string,
  fileSizeText: string
): Promise<Chapter[]> {
  try {
    const uint8 = await getPdfUint8Array(fileUri);
    console.log('[PDF] Đã đọc thành công số byte:', uint8.length);

    if (uint8 && uint8.length > 0) {
      const streamPages = extractTextFromPdfUint8Array(uint8);
      console.log('[PDF] Số trang bóc tách được:', streamPages.length);

      if (streamPages.length > 0) {
        const paginated = paginateLongText(streamPages);

        if (paginated.length > 0) {
          const chapters: Chapter[] = paginated.map((paragraphs, idx) => ({
            id: idx + 1,
            title: `Trang ${idx + 1} - ${bookTitle}`,
            subtitle: `${author} • ${fileName}`,
            content: paragraphs,
          }));

          return chapters;
        }
      }
    }
  } catch (error) {
    console.warn('[PDF] Lỗi khi trích xuất PDF:', error);
  }

  // Trường hợp tệp PDF là hình ảnh quét hoặc tài liệu đồ họa không chứa lớp ký tự text
  return [
    {
      id: 1,
      title: `Trang 1 - ${bookTitle}`,
      subtitle: `${author} • ${fileName}`,
      content: [
        `Tài liệu: ${bookTitle}`,
        `Tác giả: ${author}`,
        `Tệp gốc: ${fileName} ${fileSizeText ? `(${fileSizeText})` : ''}`.trim(),
        '──────────────────────────────',
        'Tệp PDF này đã được đồng bộ thành công vào ứng dụng HALM BOOK.',
        'Lưu ý: Tệp PDF của bạn có thể là tài liệu quét dạng hình ảnh (scanned document) hoặc bản in đồ họa không chứa lớp ký tự text trực tiếp.',
        'Bạn có thể tiếp tục đánh dấu, theo dõi tiến độ đọc và quản lý tệp này trên thiết bị.',
      ],
    },
  ];
}
