const fs = require('fs');
const path = require('path');

const tempDir = path.resolve(__dirname, '../temp_books_xhtml');
const outJsonPath = path.resolve(__dirname, '../src/data/realBooksData.json');

const configs = [
  // 1. Danh Tác Kinh Điển
  {
    key: 'lo-tan-aq-chinh-truyen',
    title: 'AQ chính truyện',
    author: 'Lỗ Tấn',
    isSplit: (t) => /^###?\s*Chương\s+\d+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },

  // 2. Hồi Ký & Lịch Sử
  {
    key: 'phan-chau-trinh-dao-duc-va-luan-ly-dong-tay',
    title: 'Đạo đức và luân lý Đông Tây',
    author: 'Phan Châu Trinh',
    isSplit: (t) => /^##?\s*(Lược sử|Đạo đức)/i.test(t),
    cleanTitle: (t) => t.replace(/^##?\s*/, '').trim()
  },
  {
    key: 'nguyen-ai-quoc-duong-kach-menh',
    title: 'Đường Kách Mệnh',
    author: 'Nguyễn Ái Quốc',
    isSplit: (t) => /^(Tư-Kách một người Kách-Mệnh|Kách mệnh\.|Lịch sử K\. M\. Mỹ\.|Kách mệnh Fáp|Lịch sử K\. M\. Nga\.|Quốc tế ngĩa là|Công hội|Quốc tế zúp dỡ|Hợp tác xã|Tổ chức kách mệnh)/i.test(t),
    cleanTitle: (t) => t.replace(/\.$/, '').trim()
  },
  {
    key: 'phan-boi-chau-nguc-trung-thu-doi-cach-mang-phan-boi-chau',
    title: 'Ngục trung thư (Đời cách mạng Phan Bội Châu)',
    author: 'Phan Bội Châu',
    isSplit: (t) => /^###?\s*[^<\n]+/.test(t) && t.length < 80,
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'phan-ke-binh-viet-nam-phong-tuc',
    title: 'Việt Nam phong tục',
    author: 'Phan Kế Bính',
    isSplit: (t) => /^(THIÊN\s+THỨ|[IVXLCDM]+\.\—|###?\s*[^<\n]+)/i.test(t) && t.length < 90,
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },

  // 3. Phóng Sự & Xã Hội
  {
    key: 'vu-trong-phung-cam-bay-nguoi',
    title: 'Cạm bẫy người',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^[IVXLCDM]+\s+[A-ZÀ-Ỹa-zà-ỹ]/.test(t) && t.length < 70 && !/^(Chú thích|Table of Contents)/i.test(t),
    cleanTitle: (t) => `Chương ${t.trim()}`
  },
  {
    key: 'vu-trong-phung-com-thay-com-co',
    title: 'Cơm thầy cơm cô',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^Chương\s+\d+\s*[-–]/i.test(t),
    cleanTitle: (t) => t.trim()
  },
  {
    key: 'thach-lam-ha-noi-bam-sau-pho-phuong',
    title: 'Hà Nội băm sáu phố phường',
    author: 'Thạch Lam',
    isSplit: (t) => /^(LỜI TỰA|NHỮNG BIỂN HÀNG|NGƯỜI TA VIẾT CHỮ TÂY|QUÀ HÀ NỘI|VẪN QUÀ HÀ NỘI|PHỤ THÊM VÀO PHỞ|BỔ KHUYẾT|BÚN SƯỜN VÀ CANH BÚN|CÒN QUÀ HÀ NỘI|NHỮNG THỨ CHUYÊN MÔN|BÁNH ĐẬU|MỘT THỨ QUÀ CỦA LÚA NON: CỐM|QUÀ \.\.\. TỨC LÀ NGƯỜI|VÀI THỨ CHUYÊN MÔN NỮA|NHỮNG CHỐN ĂN CHƠI|CHỢ MÁT BAN ĐÊM|BÀ CỤ BÁN XÔI|HÀNG NƯỚC CÔ DẦN|CÁC HIỆU CAO LÂU KHÁCH|THƯ THẢO LUẬN|BÀ CỤ BÁN XÔI LẦN NỮA)/i.test(t) && t.length < 60,
    cleanTitle: (t) => t.trim()
  },
  {
    key: 'vu-trong-phung-ky-nghe-lay-tay',
    title: 'Kỹ nghệ lấy Tây',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^(###?\s*)?Chương\s+[IVXLCDM]+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'vu-trong-phung-luc-xi',
    title: 'Lục xì',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^[IVXLCDM]+\s+[A-ZÀ-Ỹa-zà-ỹ]/.test(t) && t.length < 60 && !/^(Chú thích|Table of Contents|V\.T\.P\.)/i.test(t),
    cleanTitle: (t) => `Chương ${t.trim()}`
  },
  {
    key: 'ngo-tat-to-tap-an-cai-dinh',
    title: 'Tập án cái đình',
    author: 'Ngô Tất Tố',
    isSplit: (t) => /^(##?\s*)?[IVXLCDM]+\.\s+/i.test(t) && t.length < 80,
    cleanTitle: (t) => t.replace(/^##?\s*/, '').trim()
  },
  {
    key: 'ngo-tat-to-viec-lang',
    title: 'Việc làng',
    author: 'Ngô Tất Tố',
    isSplit: (t) => /^(LỚP NGƯỜI BỊ BỎ SÓT|MỘT ĐÁM VÀO NGÔI|CÁI ÁN ÔNG CỤ|NGHỆ THUẬT BĂM THỊT GÀ|ĐÔI GIÀY MẤT DẠY|GÓC CHIẾU GIỮA ĐÌNH|NÉN HƯƠNG SAU KHI CHẾT|HẠT GẠO XÔI MỚI|MUA CỖ|CON GÀ THỜ|CỖ OẢN TUẦN SÓC|MỘT TIỆC ĂN VẠ|XÂU LÒNG THỜ|MỘT CHIẾC LĂM LỢN|MIẾNG THỊT GIỖ HẬU|MÓN NỢ CHUNG THÂN|MỘT CÁI THẢM TRẠNG)/i.test(t) && t.length < 60,
    cleanTitle: (t) => t.trim()
  },

  // 4. Tình Cảm & Tiểu Thuyết
  {
    key: 'ho-bieu-chanh-cha-con-nghia-nang',
    title: 'Cha con nghĩa nặng',
    author: 'Hồ Biểu Chánh',
    isSplit: (t) => /^(###?\s*)?Chương\s+[IVXLCDM]+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'ho-bieu-chanh-con-nha-ngheo',
    title: 'Con nhà nghèo',
    author: 'Hồ Biểu Chánh',
    isSplit: (t) => /^(###?\s*)?Chương\s+(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|mười\s+một|mười\s+hai|mười\s+ba|mười\s+bốn)/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'vu-trong-phung-dut-tinh',
    title: 'Dứt tình',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^(###?\s*)?Chương\s+\d+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'vu-trong-phung-lam-di',
    title: 'Làm đĩ',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^(###?\s*)?Chương\s+\d+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'vu-trong-phung-lay-nhau-vi-tinh',
    title: 'Lấy nhau vì tình',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^(Phần Thứ|###?\s*Chương\s+[IVXLCDM]+)/i.test(t) && t.length < 50,
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'khai-hung-nua-chung-xuan',
    title: 'Nửa chừng xuân',
    author: 'Khái Hưng',
    isSplit: (t) => /^##?\s*[^<\n]+/.test(t) && t.length < 50 && !/^(ch001|Title Page)/i.test(t),
    cleanTitle: (t) => t.replace(/^##?\s*/, '').trim()
  },
  {
    key: 'hoang-ngoc-phach-to-tam',
    title: 'Tố Tâm',
    author: 'Hoàng Ngọc Phách',
    isSplit: (t) => /^(###?\s*)?Chương\s+[IVXLCDM]+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },

  // 5. Văn Học Hiện Thực
  {
    key: 'nam-cao-chi-pheo',
    title: 'Chí Phèo',
    author: 'Nam Cao',
    isSplit: () => false,
    cleanTitle: () => 'Chí Phèo (Toàn tác phẩm)'
  },
  {
    key: 'vu-trong-phung-giong-to',
    title: 'Giông tố',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^(###?\s*)?Chương\s+\d+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'ngo-tat-to-leu-chong',
    title: 'Lều chõng',
    author: 'Ngô Tất Tố',
    isSplit: (t) => /^CHƯƠNG\s+\d+/i.test(t),
    cleanTitle: (t) => t.trim()
  },
  {
    key: 'vu-trong-phung-so-do',
    title: 'Số đỏ',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^(###?\s*)?Chương\s+\d+/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  },
  {
    key: 'nam-cao-song-mon',
    title: 'Sống mòn',
    author: 'Nam Cao',
    isSplit: (t) => /^##?\s*Phần\s+\d+/i.test(t),
    cleanTitle: (t) => t.replace(/^##?\s*/, '').trim()
  },
  {
    key: 'ngo-tat-to-tat-den',
    title: 'Tắt đèn',
    author: 'Ngô Tất Tố',
    isSplit: (t) => /^###?\s*[IVXLCDM]+/i.test(t) && t.length < 20,
    cleanTitle: (t) => `Chương ${t.replace(/^###?\s*/, '').trim()}`
  },
  {
    key: 'vu-trong-phung-trung-so-doc-dac',
    title: 'Trúng số độc đắc',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^[IVXLCDM]+[-–][A-ZÀ-Ỹ\s]{3,40}/.test(t) && !t.includes('dtv-ebook'),
    cleanTitle: (t) => {
      const match = t.match(/^([IVXLCDM]+)[-–]([A-ZÀ-Ỹ\s]+)/);
      if (match) return `Chương ${match[1]}: ${match[2].trim()}`;
      return t.trim();
    },
    splitInline: (t) => {
      const match = t.match(/^([IVXLCDM]+[-–][A-ZÀ-Ỹ\s]{3,35})(?:\s+([A-ZÀ-Ỹa-zà-ỹ].*))?$/);
      if (match) {
        return {
          title: `Chương ${match[1].replace(/[-–]/, ': ')}`,
          rest: match[2] ? match[2].trim() : ''
        };
      }
      return null;
    }
  },
  {
    key: 'vu-trong-phung-vo-de',
    title: 'Vỡ đê',
    author: 'Vũ Trọng Phụng',
    isSplit: (t) => /^###?\s*Chương\s+\d+/i.test(t) && t.length < 50 && !/Chương 1:.*Chương 3:/i.test(t),
    cleanTitle: (t) => t.replace(/^###?\s*/, '').trim()
  }
];

const cleanHtml = (raw) => {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
};

const result = {};

for (const cfg of configs) {
  const filePath = path.join(tempDir, `${cfg.key}.xhtml`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const pMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));

  const chapters = [];
  let currentTitle = (cfg.key === 'nam-cao-chi-pheo') 
    ? 'Chí Phèo (Toàn tác phẩm)' 
    : (cfg.key === 'vu-trong-phung-trung-so-doc-dac')
      ? 'Chương I: Từ vườn hoa đến hiệu cao lâu'
      : 'Lời tựa / Lời mở đầu';
  let currentParas = [];

  for (let i = 0; i < pMatches.length; i++) {
    const rawInner = pMatches[i][1];
    const text = cleanHtml(rawInner);
    if (!text) continue;

    // Filter out initial TOC generator artifacts
    if (i === 0 && /Chương 1:.*Chương 3:/i.test(text)) continue;

    // Check special inline split (e.g. for Trung so doc dac)
    if (cfg.splitInline) {
      const inline = cfg.splitInline(text);
      if (inline) {
        if (currentParas.length > 0) {
          chapters.push({
            id: chapters.length + 1,
            title: currentTitle,
            subtitle: `${cfg.title} - ${cfg.author}`,
            content: currentParas
          });
        }
        currentTitle = inline.title;
        currentParas = inline.rest ? [inline.rest] : [];
        continue;
      }
    }

    if (cfg.isSplit(text)) {
      if (currentParas.length > 0) {
        chapters.push({
          id: chapters.length + 1,
          title: currentTitle,
          subtitle: `${cfg.title} - ${cfg.author}`,
          content: currentParas
        });
      }
      currentTitle = cfg.cleanTitle(text);
      currentParas = [];
    } else {
      currentParas.push(text);
    }
  }

  if (currentParas.length > 0) {
    chapters.push({
      id: chapters.length + 1,
      title: currentTitle,
      subtitle: `${cfg.title} - ${cfg.author}`,
      content: currentParas
    });
  }

  // Filter out leading empty intro if it's purely metadata
  if (chapters.length > 1 && chapters[0].title.startsWith('Lời tựa / Lời mở đầu')) {
    const firstParas = chapters[0].content.join(' ');
    if (chapters[0].content.length <= 4 && (firstParas.includes('dtv-ebook') || firstParas.includes('Sachvui') || firstParas.includes('Soát lỗi'))) {
      const introParas = chapters.shift().content;
      chapters[0].content.unshift(...introParas);
      chapters.forEach((c, idx) => { c.id = idx + 1; });
    }
  }

  result[cfg.key] = chapters;
  console.log(`[OK] ${cfg.key}: ${chapters.length} chapters | First: "${chapters[0]?.title}" | Last: "${chapters[chapters.length - 1]?.title}"`);
}

// Write out JSON
fs.writeFileSync(outJsonPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`\nSuccessfully written realBooksData.json to ${outJsonPath}`);
