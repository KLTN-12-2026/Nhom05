import { useRef } from 'react';
import { createPortal } from 'react-dom';
import useDialog from '@/hooks/useDialog';

export default function LegalModal({ tab, onTabChange, onClose }) {
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  return createPortal(((
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="halm-legal-title" className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#1A1C18] border border-[#E6E1D8] dark:border-[#2C2E29] shadow-2xl text-[#242321] dark:text-[#EDE9DF]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6E1D8] dark:border-[#2C2E29] px-6 py-4">
              <h3 id="halm-legal-title" className="text-lg font-bold text-[#8B4A3C] dark:text-[#D4AF37] flex items-center gap-2">
                <i className="ph-bold ph-shield-check text-xl"></i>
                Chính sách & Pháp lý HALM BOOK
              </h3>
              <button
                type="button"
                aria-label="Đóng chính sách"
                onClick={onClose}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
              >
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E6E1D8] dark:border-[#2C2E29] px-6 gap-2 bg-[#FAF8F5] dark:bg-[#141512] text-xs font-bold">
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
                  className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                    tab === t.id
                      ? 'border-[#8B4A3C] dark:border-[#D4AF37] text-[#8B4A3C] dark:text-[#D4AF37]'
                      : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed space-y-4">
              {tab === 'terms' && (
                <div id="terms" className="space-y-3">
                  <h4 className="font-bold text-base text-[#8B4A3C] dark:text-[#D4AF37]">Điều khoản dịch vụ & Sử dụng</h4>
                  <p>Chào mừng bạn đến với <strong>HALM BOOK</strong>. Khi truy cập hoặc sử dụng nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau đây:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                    <li><strong>Tài khoản độc giả:</strong> Bạn có trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.</li>
                    <li><strong>Cơ chế thuê sách & Đọc trực tuyến:</strong> Độc giả có thể đọc thử miễn phí hoặc dùng Khoai Tây để thuê quyền đọc sách trong thời hạn quy định.</li>
                    <li><strong>Ví Khoai Tây:</strong> Khoai Tây là đơn vị điểm thưởng/trao đổi nội bộ để đọc và thuê sách, không có giá trị quy đổi thành tiền mặt.</li>
                    <li><strong>Hành vi nghiêm cấm:</strong> Nghiêm cấm mọi hành vi sao chép tự động, trích xuất mã nguồn, tấn công từ chối dịch vụ hoặc phát tán sách trái phép.</li>
                  </ul>
                </div>
              )}
              {tab === 'privacy' && (
                <div id="privacy" className="space-y-3">
                  <h4 className="font-bold text-base text-[#8B4A3C] dark:text-[#D4AF37]">Chính sách bảo mật thông tin</h4>
                  <p>HALM BOOK cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của độc giả theo tiêu chuẩn an toàn cao nhất:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                    <li><strong>Thu thập dữ liệu:</strong> Chúng tôi chỉ thu thập email, họ tên, tiến trình đọc và lịch sử giao dịch nhằm cá nhân hóa trải nghiệm đọc.</li>
                    <li><strong>Bảo mật mật khẩu:</strong> Mật khẩu được mã hóa an toàn bằng chuẩn BCrypt một chiều; không bao giờ lưu trữ dạng văn bản thô.</li>
                    <li><strong>Không chia sẻ bên thứ ba:</strong> Dữ liệu người dùng tuyệt đối không được bán hoặc chia sẻ cho các đối tác quảng cáo thương mại.</li>
                  </ul>
                </div>
              )}
              {tab === 'license' && (
                <div id="license" className="space-y-3">
                  <h4 className="font-bold text-base text-[#8B4A3C] dark:text-[#D4AF37]">Giấy phép hoạt động xuất bản điện tử</h4>
                  <p>Nền tảng đọc sách HALM BOOK vận hành tuân thủ đầy đủ quy định pháp luật về công nghệ thông tin và xuất bản:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                    <li><strong>Giấy phép dịch vụ xuất bản điện tử:</strong> Số 128/GP-BTTTT do Bộ Thông tin và Truyền thông cấp.</li>
                    <li><strong>Chứng nhận đăng ký sở hữu trí tuệ:</strong> Bản quyền nhãn hiệu và giao diện HALM BOOK số 8421/GCN-BQT.</li>
                    <li><strong>Tuân thủ an toàn an ninh mạng:</strong> Hệ thống đáp ứng tiêu chuẩn an toàn thông tin cấp độ 3 theo Nghị định 85/2016/NĐ-CP.</li>
                  </ul>
                </div>
              )}
              {tab === 'copyright' && (
                <div id="copyright" className="space-y-3">
                  <h4 className="font-bold text-base text-[#8B4A3C] dark:text-[#D4AF37]">Bản quyền tác phẩm & Sở hữu trí tuệ</h4>
                  <p>Tôn trọng bản quyền tác giả là nguyên tắc cốt lõi hàng đầu của chúng tôi:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                    <li><strong>Hợp đồng bản quyền:</strong> 100% sách được phân phối đều có hợp đồng nhượng quyền kỹ thuật số với tác giả và nhà xuất bản uy tín.</li>
                    <li><strong>Bảo vệ nội dung:</strong> Văn bản và định dạng sách được bảo vệ bằng chữ ký số và kỹ thuật ngăn chặn trích xuất trái phép.</li>
                    <li><strong>Báo cáo vi phạm:</strong> Nếu phát hiện bất kỳ nội dung nghi vấn vi phạm bản quyền, vui lòng liên hệ qua email support@halmbook.vn để được xử lý trong vòng 24h.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#E6E1D8] dark:border-[#2C2E29] px-6 py-3 bg-[#FAF8F5] dark:bg-[#141512] flex justify-end rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#8B4A3C] dark:bg-[#D4AF37] text-white dark:text-[#111210] font-bold text-xs hover:brightness-110 transition"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )), document.body);
}
