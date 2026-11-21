import LegalModal from './LegalModal';
import { Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import logo from "@/assets/images/logo.png";
import { isTokenValid } from "@/services/authToken";
import { openAuthModal } from "@/components/common/AuthModal";
import { getSiteSettings, fetchSiteSettings } from "@/services/bannerService";

const FOOTER_LINK_CLASS = "transition-colors hover:text-[#8B4A3C] dark:hover:text-[#D4AF37]";

export default function UserFooter({ onOpenChatbot }) {
  const [settings, setSettings] = useState(() => getSiteSettings());
  const [legalModal, setLegalModal] = useState({ isOpen: false, tab: 'terms' });

  const openLegalModal = (tab = 'terms') => {
    setLegalModal({ isOpen: true, tab });
  };
  const closeLegalModal = () => {
    setLegalModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    fetchSiteSettings();
    const handleSettingsUpdated = (e) => {
      setSettings(e.detail?.settings || getSiteSettings());
    };
    window.addEventListener("halm-site-settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("halm-site-settings-updated", handleSettingsUpdated);
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['terms', 'privacy', 'license', 'copyright'].includes(hash)) {
        setLegalModal({ isOpen: true, tab: hash });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleFooterNav = (e, path, isPrivate = false) => {
    if (isPrivate && !isTokenValid()) {
      e.preventDefault();
      openAuthModal({ mode: 'login', message: 'Vui lòng đăng nhập để truy cập tính năng này!' });
    }
  };

  return (
    <footer className="relative z-10 border-t border-[#E6E1D8] bg-[#FAF8F5] py-12 font-nunito text-[#242321] transition-colors dark:border-[#2C2E29] dark:bg-[#111210] dark:text-[#EDE9DF]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#8B4A3C]/40 via-[#D4AF37]/50 to-[#8B4A3C]/40"></div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <section className="space-y-4">
            <a href="/" className="flex items-center gap-2.5">
              <img src={logo} alt="Halm Book Logo" className="h-9 w-9 object-contain" />
              <span className="text-2xl font-black tracking-tight text-[#8B4A3C] dark:text-[#EDE9DF]">HALM BOOK</span>
            </a>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
              <i className="ph-bold ph-book-open"></i>{settings.slogan || "Không gian Đọc Sách & Tri Thức Độc Bản"}
            </p>
            <div className="space-y-2.5 pt-1 text-sm font-medium text-[#EDE9DF]">
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]"><i className="ph-bold ph-phone"></i></span><a href={`tel:${settings.hotline || "0397409029"}`} className={FOOTER_LINK_CLASS}>{settings.hotline || "0397409029"}</a></div>
              <div className="flex items-center gap-3 break-all"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]"><i className="ph-bold ph-envelope-simple"></i></span><a href={`mailto:${settings.email || "support@halmbook.vn"}`} className={FOOTER_LINK_CLASS}>{settings.email || "support@halmbook.vn"}</a></div>
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]"><i className="ph-bold ph-map-pin"></i></span><span>{settings.address || "03 Quang Trung, TP. Đà Nẵng"}</span></div>
            </div>
            <div className="flex max-w-[260px] items-center gap-2.5 rounded-2xl border border-[#2C2E29] bg-[#181916] p-2.5 shadow-sm">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HALMBookApp" alt="Mã QR tải ứng dụng" className="h-16 w-16 rounded-xl object-contain bg-white p-1" loading="lazy" />
              <div className="text-xs"><div className="font-bold text-[#FAF7F0]">Ứng dụng HALM BOOK</div><div className="mt-0.5 text-[11px] text-[#D4AF37]">Quét tải app iOS & Android</div></div>
            </div>
          </section>
          <section className="lg:pl-4">
            <h2 className="mb-4 border-b border-[#2C2E29] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#D4AF37]">Thông tin</h2>
            <ul className="space-y-2.5 text-sm font-medium text-[#EDE9DF]/80">
              <li><a href="/#about-section" className={FOOTER_LINK_CLASS}>› Giới thiệu</a></li>
              <li><button type="button" onClick={() => onOpenChatbot?.("Tôi muốn liên hệ hỗ trợ độc giả")} className={FOOTER_LINK_CLASS}>› Liên hệ</button></li>
              <li><a href="#license" onClick={(e) => { e.preventDefault(); openLegalModal('license'); }} className={FOOTER_LINK_CLASS}>› Giấy phép hoạt động</a></li>
              <li><a href="#privacy" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }} className={FOOTER_LINK_CLASS}>› Chính sách bảo mật</a></li>
              <li><a href="#terms" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }} className={FOOTER_LINK_CLASS}>› Điều khoản dịch vụ</a></li>
            </ul>
          </section>
          <section>
            <h2 className="mb-4 border-b border-[#2C2E29] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#D4AF37]">Hỗ trợ & Độc giả</h2>
            <ul className="space-y-2.5 text-sm font-medium text-[#EDE9DF]/80">
              <li><Link to="/uudai" className={FOOTER_LINK_CLASS}>› Ưu Đãi Đặc Quyền</Link></li>
              <li><Link to="/tusachcn" onClick={(e) => handleFooterNav(e, "/tusachcn", true)} className={FOOTER_LINK_CLASS}>› Tủ Sách Cá Nhân</Link></li>
              <li><Link to="/hang" className={FOOTER_LINK_CLASS}>› Gói & Hạng Thành Viên</Link></li>
              <li><Link to="/canhan" onClick={(e) => handleFooterNav(e, "/canhan", true)} className={FOOTER_LINK_CLASS}>› Quản Lý Tài Khoản</Link></li>
              <li><button type="button" onClick={() => onOpenChatbot?.("Hỗ trợ tài khoản")} className={FOOTER_LINK_CLASS}>› Trợ Giúp AI Trực Tuyến</button></li>
            </ul>
          </section>
          <section>
            <h2 className="mb-4 border-b border-[#2C2E29] pb-2 text-sm font-extrabold uppercase tracking-wider text-[#D4AF37]">Đối tác xuất bản</h2>
            <div className="flex min-h-24 flex-wrap items-center justify-start gap-4">
              <img src="/logo.png" alt="HALM Publishing" className="max-h-12 max-w-28 object-contain opacity-85 brightness-125" />
              <img src="/logo.png" alt="NXB Kim Đồng" className="max-h-12 max-w-28 object-contain opacity-85 brightness-125" />
              <img src="/logo.png" alt="Nhà Xuất Bản Trẻ" className="max-h-12 max-w-28 object-contain opacity-85 brightness-125" />
            </div>
          </section>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#2C2E29] pt-5 text-xs text-[#96938B] sm:flex-row">
          <p>{settings.copyright || "© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu."}</p>
          <div className="flex items-center gap-6">
            <a href="#terms" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }} className={FOOTER_LINK_CLASS}>Điều khoản sử dụng</a>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }} className={FOOTER_LINK_CLASS}>Chính sách bảo mật</a>
            <a href="#copyright" onClick={(e) => { e.preventDefault(); openLegalModal('copyright'); }} className={FOOTER_LINK_CLASS}>Bản quyền tác phẩm</a>
          </div>
        </div>
      </div>

      {/* Legal & Policy Modal */}
      {legalModal.isOpen && <LegalModal tab={legalModal.tab} onTabChange={openLegalModal} onClose={closeLegalModal} />}
    </footer>
  );
}
