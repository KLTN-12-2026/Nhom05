import { useRef } from 'react';
import { createPortal } from 'react-dom';
import useDialog from '@/hooks/useDialog';

export default function LegalModal({ tab, onTabChange, onClose }) {
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  return createPortal((
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="halm-legal-title"
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[#181916] border border-[#2C2E29] shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-[#EDE9DF] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Viền sáng hoàng gia trên cùng */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B3038] via-[#D4AF37] to-[#8B3038]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2C2E29] px-6 py-4.5 bg-[#141512]">
          <h3 id="halm-legal-title" className="text-lg font-bold text-[#FAF7F0] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37]">
              <i className="ph-bold ph-shield-check text-lg"></i>
            </div>
            <span>Chính sách & Pháp lý HALM BOOK</span>
          </h3>
          <button
            type="button"
            aria-label="Đóng chính sách"
            onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center bg-[#20221E] border border-[#2C2E29] text-[#96938B] hover:text-[#EDE9DF] hover:bg-[#282A24] transition cursor-pointer"
          >
            <i className="ph-bold ph-x text-base"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2C2E29] px-6 gap-2 bg-[#141512] text-xs font-bold overflow-x-auto">
          {[
            { id: 'terms', label: 'Điều khoản dịch vụ' },
            { id: 'privacy', label: 'Chính sách bảo mật' },
            { id: 'license', label: 'Giấy phép hoạt động' },
            { id: 'copyright', label: 'Bản quyền tác phẩm' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-[#96938B] hover:text-[#FAF7F0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed space-y-4 text-[#C5C2BA]">
          {tab === 'terms' && (
            <div id="terms" className="space-y-3">
              <h4 className="font-bold text-base text-[#FAF7F0]">Điều khoản dịch vụ & Sử dụng</h4>
              <p>Chào mừng bạn đến với <strong className="text-[#FAF7F0]">HALM BOOK</strong>. Khi truy cập hoặc sử dụng nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau đây:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#C5C2BA]">
                <li><strong className="text-[#FAF7F0]">Tài khoản độc giả:</strong> Bạn có trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.</li>
                <li><strong className="text-[#FAF7F0]">Cơ chế thuê sách & Đọc trực tuyến:</strong> Độc giả có thể đọc thử miễn phí hoặc dùng Khoai Tây để thuê quyền đọc sách trong thời hạn quy định.</li>
                <li><strong className="text-[#FAF7F0]">Ví Khoai Tây:</strong> Khoai Tây là đơn vị điểm thưởng/trao đổi nội bộ để đọc và thuê sách, không có giá trị quy đổi thành tiền mặt.</li>
                <li><strong className="text-[#FAF7F0]">Hành vi nghiêm cấm:</strong> Nghiêm cấm mọi hành vi sao chép tự động, trích xuất mã nguồn, tấn công từ chối dịch vụ hoặc phát tán sách trái phép.</li>
              </ul>
            </div>
          )}
          {tab === 'privacy' && (
            <div id="privacy" className="space-y-3">
              <h4 className="font-bold text-base text-[#FAF7F0]">Chính sách bảo mật thông tin</h4>
              <p>HALM BOOK cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của độc giả theo tiêu chuẩn an toàn cao nhất:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#C5C2BA]">
                <li><strong className="text-[#FAF7F0]">Thu thập dữ liệu:</strong> Chúng tôi chỉ thu thập email, họ tên, tiến trình đọc và lịch sử giao dịch nhằm cá nhân hóa trải nghiệm đọc.</li>
                <li><strong className="text-[#FAF7F0]">Bảo mật mật khẩu:</strong> Mật khẩu được mã hóa an toàn bằng chuẩn BCrypt một chiều; không bao giờ lưu trữ dạng văn bản thô.</li>
                <li><strong className="text-[#FAF7F0]">Không chia sẻ bên thứ ba:</strong> Dữ liệu người dùng tuyệt đối không được bán hoặc chia sẻ cho các đối tác quảng cáo thương mại.</li>
              </ul>
            </div>
          )}
          {tab === 'license' && (
            <div id="license" className="space-y-3">
              <h4 className="font-bold text-base text-[#FAF7F0]">Giấy phép hoạt động xuất bản điện tử</h4>
              <p>Nền tảng đọc sách HALM BOOK vận hành tuân thủ đầy đủ quy định pháp luật về công nghệ thông tin và xuất bản:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#C5C2BA]">
                <li><strong className="text-[#FAF7F0]">Giấy phép dịch vụ xuất bản điện tử:</strong> Số 128/GP-BTTTT do Bộ Thông tin và Truyền thông cấp.</li>
                <li><strong className="text-[#FAF7F0]">Chứng nhận đăng ký sở hữu trí tuệ:</strong> Bản quyền nhãn hiệu và giao diện HALM BOOK số 8421/GCN-BQT.</li>
                <li><strong className="text-[#FAF7F0]">Tuân thủ an toàn an ninh mạng:</strong> Hệ thống đáp ứng tiêu chuẩn an toàn thông tin cấp độ 3 theo Nghị định 85/2016/NĐ-CP.</li>
              </ul>
            </div>
          )}
          {tab === 'copyright' && (
            <div id="copyright" className="space-y-3">
              <h4 className="font-bold text-base text-[#FAF7F0]">Bản quyền tác phẩm & Sở hữu trí tuệ</h4>
              <p>Tôn trọng bản quyền tác giả là nguyên tắc cốt lõi hàng đầu của chúng tôi:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#C5C2BA]">
                <li><strong className="text-[#FAF7F0]">Hợp đồng bản quyền:</strong> 100% sách được phân phối đều có hợp đồng nhượng quyền kỹ thuật số với tác giả và nhà xuất bản uy tín.</li>
                <li><strong className="text-[#FAF7F0]">Bảo vệ nội dung:</strong> Văn bản và định dạng sách được bảo vệ bằng chữ ký số và kỹ thuật ngăn chặn trích xuất trái phép.</li>
                <li><strong className="text-[#FAF7F0]">Báo cáo vi phạm:</strong> Nếu phát hiện bất kỳ nội dung nghi vấn vi phạm bản quyền, vui lòng liên hệ qua email support@halmbook.vn để được xử lý trong vòng 24h.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2C2E29] px-6 py-3.5 bg-[#141512] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #E6C65C 50%, #C59B27 100%)',
              color: '#141412',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            }}
            className="btn-gold px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide border border-[#D4AF37]/40 hover:brightness-110 transition cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
