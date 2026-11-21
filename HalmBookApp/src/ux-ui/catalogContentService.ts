import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL, fetchApiWithFallback, normalizeAssetUrl } from './apiService';
import { Chapter, extractPdfBytesChapters } from './pdfExtractor';
import pako from 'pako';

function decode(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

/** Read EPUB text locally. Never execute scripts or load resources from an uploaded HTML document. */
export function extractEpubChapters(bytes: Uint8Array): Chapter[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0 || view.getUint32(end, true) !== 0x06054b50) throw new Error('Tệp EPUB không hợp lệ.');
  const entries = new Map<string, () => string>();
  let offset = view.getUint32(end + 16, true);
  const count = view.getUint16(end + 10, true);
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Mục lục EPUB không hợp lệ.');
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const name = decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localOffset = view.getUint32(offset + 42, true);
    if (size > 10 * 1024 * 1024) throw new Error('Một chương EPUB vượt quá dung lượng hỗ trợ.');
    entries.set(name, () => {
      const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const compressed = bytes.subarray(start, start + compressedSize);
      if (method !== 0 && method !== 8) throw new Error('Kiểu nén EPUB chưa được hỗ trợ.');
      return decode(method === 0 ? compressed : pako.inflateRaw(compressed));
    });
    offset += 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  const attribute = (tag: string, name: string) => tag.match(new RegExp('\\b' + name + '=["\x27]([^"\x27]+)["\x27]'))?.[1];
  const container = entries.get('META-INF/container.xml')?.() ?? '';
  const opfPath = attribute(container.match(/<rootfile\b[^>]*>/)?.[0] ?? '', 'full-path');
  const opf = opfPath ? entries.get(opfPath)?.() : undefined;
  const prefix = opfPath?.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const manifest = new Map<string, string>();
  for (const tag of opf?.match(/<item\b[^>]*>/g) ?? []) {
    const id = attribute(tag, 'id'), href = attribute(tag, 'href');
    if (id && href) manifest.set(id, prefix + decodeURIComponent(href.split('#')[0]));
  }
  const spine = (opf?.match(/<itemref\b[^>]*>/g) ?? []).map(tag => manifest.get(attribute(tag, 'idref') ?? '')).filter((name): name is string => Boolean(name));
  const names = spine.length ? spine : [...entries.keys()].filter(name => /\.(xhtml|html|htm)$/i.test(name)).sort();
  const plain = (html: string) => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|h[1-6]|div|li)>|<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, entity: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[entity] ?? '')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => String.fromCodePoint(code.startsWith('x') ? parseInt(code.slice(1), 16) : Number(code)));
  return names.map((name, index) => {
    const html = entries.get(name)?.() ?? '';
    return { id: index + 1, title: plain(html.match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i)?.[1] ?? `Chương ${index + 1}`).trim(), subtitle: '',
      content: plain(html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html).split('\n').map(line => line.trim()).filter(Boolean) };
  }).filter(chapter => chapter.content.length > 0);
}

export interface CatalogContent {
  chapters: Chapter[];
  uri: string;
  format: string;
  open: () => Promise<void>;
  dispose: () => void;
}

export async function loadCatalogContent(bookId: string, title: string, author: string, signal: AbortSignal): Promise<CatalogContent> {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('Vui lòng đăng nhập để đọc sách.');
  const authorization = { Authorization: 'Bearer ' + token };
  const result = await fetchApiWithFallback<{ readUrl: string; fileFormat: string }>(`/api/home/books/${encodeURIComponent(bookId)}/read-url`, {
    headers: authorization, signal,
  });
  const url = normalizeAssetUrl(result.data.readUrl);
  const parsedUrl = new URL(url);
  if (parsedUrl.origin !== new URL(API_BASE_URL).origin && parsedUrl.protocol !== 'https:') throw new Error('Địa chỉ nội dung không hợp lệ.');
  const response = await fetch(url, { signal, headers: parsedUrl.origin === new URL(API_BASE_URL).origin ? authorization : undefined });
  if (!response.ok) throw new Error('Không tải được nội dung sách (' + response.status + ').');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (signal.aborted) throw new Error('Đã hủy tải sách.');
  const format = result.data.fileFormat.toUpperCase();
  const chapters = format === 'EPUB' ? extractEpubChapters(bytes) : extractPdfBytesChapters(bytes, title + '.pdf', title, author);
  if (Platform.OS === 'web') {
    const uri = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: format === 'EPUB' ? 'application/epub+zip' : 'application/pdf' }));
    return { chapters, uri, format, open: async () => { window.open(uri, '_blank', 'noopener'); }, dispose: () => URL.revokeObjectURL(uri) };
  }
  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, 'halm-' + Date.now() + '-' + Math.random().toString(36).slice(2) + (format === 'EPUB' ? '.epub' : '.pdf'));
  await file.write(bytes);
  if (signal.aborted) { await file.delete(); throw new Error('Đã hủy tải sách.'); }
  return { chapters, uri: file.uri, format, open: async () => {
    if (!await File.canPreview(file)) throw new Error('Thiết bị chưa có ứng dụng hỗ trợ mở tài liệu này.');
    await File.preview(file, { title });
  }, dispose: () => { try { file.delete(); } catch { /* Already removed. */ } } };
}
