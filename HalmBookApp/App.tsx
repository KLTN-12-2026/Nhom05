import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurTargetView } from 'expo-blur';
import { ComponentRef, ComponentType, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatBotScreen, { ChatMessage } from './src/ux-ui/chatbot';
import BookDetailScreen from './src/ux-ui/chitietsach';
import DmTrangChu from './src/ux-ui/dmtrangchu';
import Footer, { PRIMARY_TABS } from './src/ux-ui/footer';
import GioHang from './src/ux-ui/giohang';
import LoginLogout from './src/ux-ui/loginlogout';
import HalmBookHistory from './src/ux-ui/lsgiaodich';
import ManHinhDoc from './src/ux-ui/manhinhdoc';
import { AppLanguage, AppScreen, BookData, NavigationContext } from './src/ux-ui/navigation';
import ThanhToan from './src/ux-ui/PTThanhtoan';
import SharedHeader from './src/ux-ui/sharedheader';
import TheLoai from './src/ux-ui/theloai';
import TimKiem from './src/ux-ui/timkiem';
import TrangCaNhan from './src/ux-ui/trangcanhan';
import TrangChu from './src/ux-ui/trangchu';
import TuSach from './src/ux-ui/tusach';
import UploadFile from './src/ux-ui/uploadfile';
import UuDai from './src/ux-ui/uudai';

interface ScreenRoute {
  name: AppScreen;
  book?: BookData;
}

const SCREENS_WITH_SHARED_HEADER: AppScreen[] = [
  'upload',
  'bookshelf',
  'categories',
  'search',
  'transactions',
];

const LoginLogoutWithSuccess = LoginLogout as ComponentType<{ onLoginSuccess: () => void }>;

// Quản lý cờ phiên làm việc: Sống trong RAM của tiến trình app hiện tại
const isSessionActive = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage.getItem('halm_session_active') === 'true';
  }
  return (globalThis as any).__HALM_SESSION_ACTIVE__ === true;
};

const setSessionActive = (active: boolean) => {
  (globalThis as any).__HALM_SESSION_ACTIVE__ = active;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    if (active) {
      window.sessionStorage.setItem('halm_session_active', 'true');
    } else {
      window.sessionStorage.removeItem('halm_session_active');
    }
  }
};

export default function App() {
  const [routes, setRoutes] = useState<ScreenRoute[]>([{ name: 'auth' }]);
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
<<<<<<< HEAD
  // [GIẢI THÍCH CODE]: Quản lý ảnh đại diện & chữ cái đầu đồng bộ cho các màn được chỉ định
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');
  const [userInitial, setUserInitial] = useState<string>('H');

  // [GIẢI THÍCH CODE]: Quản lý ngôn ngữ toàn cục ứng dụng (vi / en)
  const [lang, setLangState] = useState<AppLanguage>('vi');

  useEffect(() => {
    AsyncStorage.getItem('appLanguage').then((saved) => {
      if (saved === 'vi' || saved === 'en') {
        setLangState(saved as AppLanguage);
      }
    }).catch(() => {});
  }, []);

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang);
    AsyncStorage.setItem('appLanguage', newLang).catch(() => {});
  };

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
=======
>>>>>>> origin/main

  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Mình là trợ lý HALM. Bạn cần hỗ trợ gì?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Khôi phục phiên làm việc: Reload trong cùng phiên thì giữ lại, tắt app chạy phiên mới thì bắt buộc login
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const sessionActive = isSessionActive();

        // Nếu đây là phiên chạy mới (Fresh launch / Mở app từ đầu)
        if (!sessionActive) {
          // Xóa token cũ và vị trí màn hình cũ để đảm bảo đăng nhập mới cấp token chuẩn từ MySQL
          await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes']);
          if (isMounted) {
            setRoutes([{ name: 'auth' }]);
            setIsReady(true);
          }
          return;
        }

        // Nếu là reload trong cùng phiên làm việc (FE & BE vẫn đang chạy liên tục)
        const token = await AsyncStorage.getItem('userToken');
        if (token && isMounted) {
          const savedRoutesStr = await AsyncStorage.getItem('savedRoutes');
          if (savedRoutesStr) {
            const parsed = JSON.parse(savedRoutesStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRoutes(parsed);
              setIsReady(true);
              return;
            }
          }
          setRoutes([{ name: 'home' }]);
        } else if (isMounted) {
          setRoutes([{ name: 'auth' }]);
        }
      } catch (err) {
        console.warn('Lỗi khôi phục session Expo:', err);
        if (isMounted) setRoutes([{ name: 'auth' }]);
      } finally {
        if (isMounted) setIsReady(true);
      }
    };
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tự động lưu lại vị trí màn hình hiện tại để khi reload Expo vẫn giữ nguyên
  useEffect(() => {
    if (!isReady) return;
    if (routes.length > 0 && routes[routes.length - 1].name !== 'auth') {
      AsyncStorage.setItem('savedRoutes', JSON.stringify(routes)).catch(() => {});
    } else {
      AsyncStorage.removeItem('savedRoutes').catch(() => {});
    }
  }, [routes, isReady]);

  const currentRoute = routes[routes.length - 1];
  const activeTabRoute = [...routes].reverse().find((route) =>
    PRIMARY_TABS.some((tab) => tab.id === route.name),
  );
  const activeNav = activeTabRoute?.name ?? 'home';

  const navigate = (name: AppScreen, book?: BookData) => {
<<<<<<< HEAD
    if (!isLoggedIn) {
      if (name === 'upload') {
        showLoginAlert(lang === 'en' ? 'Please log in to use upload file feature' : 'Bạn phải đăng nhập mới dùng được chức năng uploadfile');
        return;
      }
      if (name === 'bookshelf') {
        showLoginAlert(lang === 'en' ? 'Please log in to use bookshelf feature' : 'Bạn phải đăng nhập để dùng chức năng tủ sách');
        return;
      }
      if (name === 'profile') {
        showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân');
        return;
      }
      if (name === 'cart') {
        showLoginAlert(lang === 'en' ? 'Please log in to use cart feature' : 'Bạn phải đăng nhập để dùng chức năng giỏ hàng');
        return;
      }
      if (name === 'payment') {
        showLoginAlert(lang === 'en' ? 'Please log in to proceed to payment' : 'Bạn phải đăng nhập để thanh toán');
        return;
      }
    }
=======
>>>>>>> origin/main
    setIsFooterVisible(true);
    setRoutes((current) => [...current, { name, book }]);
  };

  const navigateTab = (name: AppScreen) => {
<<<<<<< HEAD
    if (!isLoggedIn) {
      if (name === 'upload') {
        showLoginAlert(lang === 'en' ? 'Please log in to use upload file feature' : 'Bạn phải đăng nhập mới dùng được chức năng uploadfile');
        return;
      }
      if (name === 'bookshelf') {
        showLoginAlert(lang === 'en' ? 'Please log in to use bookshelf feature' : 'Bạn phải đăng nhập để dùng chức năng tủ sách');
        return;
      }
      if (name === 'profile') {
        showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân');
        return;
      }
      if (name === 'cart') {
        showLoginAlert(lang === 'en' ? 'Please log in to use cart feature' : 'Bạn phải đăng nhập để dùng chức năng giỏ hàng');
        return;
      }
    }
=======
>>>>>>> origin/main
    setIsFooterVisible(true);
    setRoutes([{ name }]);
  };

  const lastBackPressTime = useRef(0);
  const goBack = () => {
    const now = Date.now();
    if (now - lastBackPressTime.current < 450) return;
    lastBackPressTime.current = now;
    setIsFooterVisible(true);
    setRoutes((current) => (current.length > 1 ? current.slice(0, -1) : current));
  };

  const finishLogin = () => {
    setSessionActive(true);
    const nextRoutes: ScreenRoute[] = [{ name: 'home' }];
    setRoutes(nextRoutes);
    AsyncStorage.setItem('savedRoutes', JSON.stringify(nextRoutes)).catch(() => {});
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routes.length <= 1) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [routes.length]);

  const logout = async () => {
    try {
      setSessionActive(false);
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes']);
      setRoutes([{ name: 'auth' }]);
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

  const toggleDarkMode = () => setIsDarkMode((current) => !current);
  const refreshHome = () => setHomeRefreshKey((current) => current + 1);
  const navigation = {
    navigate,
    navigateTab,
    goBack,
    logout,
    isDarkMode,
    toggleDarkMode,
    isLoggedIn: isSessionActive(),
    showLoginAlert: (message: string) => {
      Alert.alert(
        'Yêu cầu đăng nhập',
        message,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập ngay', onPress: () => navigate('auth') },
        ],
      );
    },
    isFooterVisible,
    setFooterVisible: setIsFooterVisible,
<<<<<<< HEAD
    userAvatarUrl,
    setUserAvatarUrl,
    userInitial,
    setUserInitial,
    lang,
    setLang,
=======
>>>>>>> origin/main
  };
  const showSharedHeader = SCREENS_WITH_SHARED_HEADER.includes(currentRoute.name);

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
      screen = <ManHinhDoc onBack={goBack} book={currentRoute.book} />;
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
          onStartReading={(initialChapterIndex) =>
            navigate('reader', {
              ...currentRoute.book,
              id: currentRoute.book?.id || 'book-1',
              title: currentRoute.book?.title || 'Đọc sách',
              initialChapterIndex: typeof initialChapterIndex === 'number' ? initialChapterIndex : 0,
            })
          }
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
                floating={['home', 'bookDetail', 'offers'].includes(currentRoute.name)}
                visible={isFooterVisible}
              />
            )}
          </View>
        )}
<<<<<<< HEAD

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
          lang={lang}
        />
=======
>>>>>>> origin/main
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
