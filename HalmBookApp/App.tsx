import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurTargetView } from 'expo-blur';
import { ComponentRef, ComponentType, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatBotScreen, { ChatMessage } from './src/ux-ui/chatbot';
import BookDetailScreen from './src/ux-ui/chitietsach';
import DmTrangChu from './src/ux-ui/dmtrangchu';
import Footer, { PRIMARY_TABS } from './src/ux-ui/footer';
import GioHang from './src/ux-ui/giohang';
import LoginLogout from './src/ux-ui/loginlogout';
import HalmBookHistory from './src/ux-ui/lsgiaodich';
import ManHinhDoc from './src/ux-ui/manhinhdoc';
import { AppScreen, BookData, NavigationContext } from './src/ux-ui/navigation';
import ThanhToan from './src/ux-ui/PTThanhtoan';
import SharedHeader from './src/ux-ui/sharedheader';
import TheLoai from './src/ux-ui/theloai';
import TimKiem from './src/ux-ui/timkiem';
import TrangCaNhan from './src/ux-ui/trangcanhan';
import TrangChu from './src/ux-ui/trangchu';
import TuSach from './src/ux-ui/tusach';
import UploadFile from './src/ux-ui/uploadfile';
import UuDai from './src/ux-ui/uudai';
import AuthRequiredModal from './src/ux-ui/AuthRequiredModal';

interface ScreenRoute {
  name: AppScreen;
  book?: BookData;
}

const SCREENS_WITH_SHARED_HEADER: AppScreen[] = [
  'offers',
  'upload',
  'bookshelf',
  'categories',
  'search',
  'transactions',
];

const LoginLogoutWithSuccess = LoginLogout as ComponentType<{ onLoginSuccess: () => void }>;

export default function App() {
  // ============================================================================
  // [GIẢI THÍCH CODE]: MỚI CHẠY LÊN MẶC ĐỊNH LÀ MÀN TRANG CHỦ CHƯA ĐĂNG NHẬP
  // - routes khởi tạo là [{ name: 'home' }] -> vào ngay Trang chủ
  // - isLoggedIn khởi tạo là false -> khách vãng lai (chưa đăng nhập)
  // ============================================================================
  const [routes, setRoutes] = useState<ScreenRoute[]>([{ name: 'home' }]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Quản lý bản thông báo yêu cầu đăng nhập
  // Khi khách vãng lai nhấn uploadfile, trang cá nhân, tủ sách hoặc thanh toán,
  // modal này sẽ bật lên hiển thị dòng thông báo kèm nút "Đăng nhập ngay"
  // ============================================================================
  const [authModal, setAuthModal] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: '',
  });

  const showLoginAlert = (message: string) => {
    setAuthModal({
      visible: true,
      message,
    });
  };

  const closeAuthModal = () => {
    setAuthModal({ visible: false, message: '' });
  };

  const handleModalLoginPress = () => {
    closeAuthModal();
    // [GIẢI THÍCH CODE]: Nhấn "Đăng nhập ngay" -> chuyển sang màn hình đăng nhập
    navigate('auth');
  };

  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Mình là trợ lý HALM. Bạn cần hỗ trợ gì?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // ============================================================================
  // [GIẢI THÍCH CODE]: KHỞI TẠO ỨNG DỤNG MẶC ĐỊNH LÀ KHÁCH VÃNG LAI TẠI TRANG CHỦ
  // Khi mới chạy ứng dụng lên, xóa các token/phiên cũ lưu trong máy để đảm bảo:
  // 1. Luôn mở màn hình Trang chủ ('home')
  // 2. Luôn ở trạng thái Chưa đăng nhập (isLoggedIn = false)
  // 3. Khách muốn đăng nhập sẽ bấm vào icon account ở góc hoặc nút "Đăng nhập ngay"
  // ============================================================================
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes']);
        if (isMounted) {
          setIsLoggedIn(false);
          setRoutes([{ name: 'home' }]);
        }
      } catch (err) {
        console.warn('Lỗi khởi tạo app:', err);
      } finally {
        if (isMounted) setIsReady(true);
      }
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentRoute = routes[routes.length - 1];
  const activeTabRoute = [...routes].reverse().find((route) =>
    PRIMARY_TABS.some((tab) => tab.id === route.name),
  );
  const activeNav = activeTabRoute?.name ?? 'home';

  // ============================================================================
  // [GIẢI THÍCH CODE]: Hàm điều hướng `navigate`
  // Tự động chặn khách vãng lai nếu cố gắng mở các màn hình yêu cầu tài khoản
  // ============================================================================
  const navigate = (name: AppScreen, book?: BookData) => {
    if (!isLoggedIn) {
      if (name === 'upload') {
        showLoginAlert('Bạn phải đăng nhập mới dùng được chức năng uploadfile');
        return;
      }
      if (name === 'bookshelf') {
        showLoginAlert('Bạn phải đăng nhập để dùng chức năng tủ sách');
        return;
      }
      if (name === 'profile') {
        showLoginAlert('Bạn phải đăng nhập để dùng chức năng trang cá nhân');
        return;
      }
      if (name === 'cart') {
        showLoginAlert('Bạn phải đăng nhập để dùng chức năng giỏ hàng');
        return;
      }
      if (name === 'payment') {
        showLoginAlert('Bạn phải đăng nhập để thanh toán');
        return;
      }
    }
    setIsFooterVisible(true);
    setRoutes((current) => [...current, { name, book }]);
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: Hàm chuyển tab Footer `navigateTab`
  // Tự động chặn khách vãng lai khi nhấn vào các tab upload, tủ sách, trang cá nhân
  // ============================================================================
  const navigateTab = (name: AppScreen) => {
    if (!isLoggedIn) {
      if (name === 'upload') {
        showLoginAlert('Bạn phải đăng nhập mới dùng được chức năng uploadfile');
        return;
      }
      if (name === 'bookshelf') {
        showLoginAlert('Bạn phải đăng nhập để dùng chức năng tủ sách');
        return;
      }
      if (name === 'profile') {
        showLoginAlert('Bạn phải đăng nhập để dùng chức năng trang cá nhân');
        return;
      }
      if (name === 'cart') {
        showLoginAlert('Bạn phải đăng nhập để dùng chức năng giỏ hàng');
        return;
      }
    }
    setIsFooterVisible(true);
    setRoutes([{ name }]);
  };

  const goBack = () => {
    setIsFooterVisible(true);
    // Nếu ngăn xếp chỉ còn 1 trang (ví dụ màn auth), quay về màn home
    setRoutes((current) => current.length > 1 ? current.slice(0, -1) : [{ name: 'home' }]);
  };

  // [GIẢI THÍCH CODE]: Khi đăng nhập thành công, cập nhật isLoggedIn = true và về Trang chủ
  const finishLogin = () => {
    setIsLoggedIn(true);
    setRoutes([{ name: 'home' }]);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routes.length <= 1) return false;
      setRoutes((current) => current.length > 1 ? current.slice(0, -1) : current);
      return true;
    });
    return () => subscription.remove();
  }, [routes.length]);

  // [GIẢI THÍCH CODE]: Khi đăng xuất, xóa token và đưa người dùng về Trang chủ làm khách vãng lai
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes']);
      setIsLoggedIn(false);
      setRoutes([{ name: 'home' }]);
    } catch {
      Alert.alert('Không thể đăng xuất', 'Đã xảy ra lỗi khi xóa thông tin đăng nhập.');
    }
  };

  const sendChatMessage = (text: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setChatMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, sender: 'user', text, time },
      {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: 'Mình đã nhận được tin nhắn. Tính năng trả lời tự động chưa được kết nối.',
        time,
      },
    ]);
  };

  const navigation = {
    navigate,
    navigateTab,
    goBack,
    logout,
    isDarkMode,
    isLoggedIn,
    setIsLoggedIn,
    showLoginAlert,
    isFooterVisible,
    setFooterVisible: setIsFooterVisible,
  };
  const showSharedHeader = SCREENS_WITH_SHARED_HEADER.includes(currentRoute.name);
  const toggleDarkMode = () => setIsDarkMode((current) => !current);
  const refreshHome = () => setHomeRefreshKey((current) => current + 1);

  let screen;
  switch (currentRoute.name) {
    case 'auth':
      screen = <LoginLogoutWithSuccess onLoginSuccess={finishLogin} />;
      break;
    case 'home':
      screen = (
        <TrangChu
          key={homeRefreshKey}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onRefresh={refreshHome}
        />
      );
      break;
    case 'dmHome':
      screen = <DmTrangChu isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
      break;
    case 'offers':
      screen = <UuDai />;
      break;
    case 'upload':
      screen = <UploadFile />;
      break;
    case 'bookshelf':
      screen = <TuSach />;
      break;
    case 'profile':
      screen = <TrangCaNhan />;
      break;
    case 'categories':
      screen = <TheLoai />;
      break;
    case 'search':
      screen = <TimKiem />;
      break;
    case 'cart':
      screen = <GioHang />;
      break;
    case 'transactions':
      screen = <HalmBookHistory />;
      break;
    case 'reader':
      screen = <ManHinhDoc onBack={goBack} />;
      break;
    case 'payment':
      screen = <ThanhToan />;
      break;
    case 'chatbot':
      screen = (
        <ChatBotScreen
          messages={chatMessages}
          onBack={goBack}
          onSendMessage={sendChatMessage}
        />
      );
      break;
    case 'bookDetail':
      screen = currentRoute.book ? (
        <BookDetailScreen
          book={currentRoute.book}
          onBack={goBack}
          onStartReading={() => navigate('reader')}
        />
      ) : null;
      break;
  }

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#101319' : '#fff' }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContext.Provider value={navigation}>
        {currentRoute.name === 'auth' ? screen : (
          <View style={{ flex: 1 }}>
            {showSharedHeader && (
              <SharedHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                blurTarget={blurTargetRef}
                compact={['offers', 'upload', 'bookshelf'].includes(currentRoute.name)}
              />
            )}
            <BlurTargetView
              ref={blurTargetRef}
              style={{ flex: 1, backgroundColor: isDarkMode ? '#101319' : '#fff' }}
            >
              {screen}
            </BlurTargetView>
            {!['auth', 'reader', 'chatbot'].includes(currentRoute.name) && (
              <Footer
                activeNav={activeNav}
                floating={currentRoute.name === 'home' || currentRoute.name === 'bookDetail'}
                visible={isFooterVisible}
              />
            )}
          </View>
        )}

        {/* ============================================================================
            [GIẢI THÍCH CODE]: BẢN THÔNG BÁO YÊU CẦU ĐĂNG NHẬP
            Hiển thị đè lên trên màn hình khi khách vãng lai nhấn uploadfile, trangcanhan,
            tusach hoặc thanh toán giỏ hàng. Có dòng 'Đăng nhập ngay' để vào màn đăng nhập.
            ============================================================================ */}
        <AuthRequiredModal
          visible={authModal.visible}
          message={authModal.message}
          onClose={closeAuthModal}
          onLogin={handleModalLoginPress}
          isDarkMode={isDarkMode}
        />
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
