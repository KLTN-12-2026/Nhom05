import UserHeader from './UserHeader';
import UserFooter from './UserFooter';
import PotatoChatbot from '@/components/common/PotatoChatbot';
import AuthModal from '@/components/common/AuthModal';

export default function UserLayout({ children, className = "", onOpenChatbot, onThemeChange }) {
  const handleOpenChat = (msg) => {
    if (typeof onOpenChatbot === 'function') {
      onOpenChatbot(msg);
    } else {
      window.dispatchEvent(new CustomEvent('halm-open-chatbot', { detail: { message: msg } }));
    }
  };

  return (
    <div className={`paper-grain relative flex min-h-screen flex-col ${className}`}>
      <UserHeader onOpenChatbot={handleOpenChat} onThemeChange={onThemeChange} />
      {children}
      <UserFooter onOpenChatbot={handleOpenChat} />
      <PotatoChatbot />
      <AuthModal />
    </div>
  );
}
