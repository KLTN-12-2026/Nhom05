import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BlurTargetView } from 'expo-blur';
import { ComponentRef, ComponentType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Platform, View } from 'react-native';
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
import ThongBaoScreen from './src/ux-ui/thongbao';
import TimKiem from './src/ux-ui/timkiem';
import TrangCaNhan from './src/ux-ui/trangcanhan';
import TrangChu from './src/ux-ui/trangchu';
import TuSach from './src/ux-ui/tusach';
import UploadFile from './src/ux-ui/uploadfile';
import UuDai from './src/ux-ui/uudai';
import AuthRequiredModal from './src/ux-ui/AuthRequiredModal';
import { API_BASE_URL } from './src/ux-ui/apiService';
import { addToReadingList } from './src/ux-ui/readingHistory';
import { clearLegacyBookshelfKeys } from './src/ux-ui/userStorage';

interface ScreenRoute {
  name: AppScreen;
  book?: BookData;
}

const SCREENS_WITH_SHARED_HEADER: AppScreen[] = [
  'offers',
  'categories',
  'transactions',
];

// Cấu hình hiệu ứng chuyển trang mượt mà (Navigation Transition Options)
const SCREEN_TRANSITION_OPTIONS: Partial<
  Record<AppScreen, { headerShown: boolean; animation: 'fade' | 'default' }>
> = {
  search: {
    headerShown: false,
    animation: 'fade',
  },
};

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isSessionActive());
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

  const setLang = useCallback((newLang: AppLanguage) => {
    setLangState(newLang);
    AsyncStorage.setItem('appLanguage', newLang).catch(() => {});
  }, []);

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

  const showLoginAlert = useCallback((message: string) => {
    setAuthModal({
      visible: true,
      message,
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal({ visible: false, message: '' });
  }, []);

  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Mình là HALM.AI - trợ lý ảo của HALM BOOK. Bạn có thể hỏi mình tìm sách, tư vấn tác phẩm hoặc giải đáp thắc mắc!',
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
          await AsyncStorage.multiRemove([
            'userToken',
            'accessToken',
            'refreshToken',
            'userRole',
            'userProfile',
            'savedRoutes',
          ]);
          if (isMounted) {
            setIsLoggedIn(false);
            setRoutes([{ name: 'auth' }]);
            setIsReady(true);
          }
          return;
        }

        // Nếu là reload trong cùng phiên làm việc (FE & BE vẫn đang chạy liên tục)
        const token = await AsyncStorage.getItem('userToken');
        const profileStr = await AsyncStorage.getItem('userProfile');
        if (profileStr && isMounted) {
          try {
            const profile = JSON.parse(profileStr);
            if (profile?.avatar) setUserAvatarUrl(profile.avatar);
            if (profile?.fullName) {
              setUserInitial(String(profile.fullName).trim().charAt(0).toUpperCase());
            }
          } catch {
            // Bỏ qua lỗi parse profile
          }
        }

        if (token && isMounted) {
          setSessionActive(true);
          setIsLoggedIn(true);
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
          setIsLoggedIn(false);
          setRoutes([{ name: 'auth' }]);
        }
      } catch (err) {
        console.warn('Lỗi khôi phục session Expo:', err);
        if (isMounted) {
          setIsLoggedIn(false);
          setRoutes([{ name: 'auth' }]);
        }
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
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const prevRouteNameRef = useRef<AppScreen>(currentRoute.name);

  useEffect(() => {
    const prevName = prevRouteNameRef.current;
    const nextName = currentRoute.name;
    prevRouteNameRef.current = nextName;

    const usesFade =
      SCREEN_TRANSITION_OPTIONS[nextName]?.animation === 'fade' ||
      SCREEN_TRANSITION_OPTIONS[prevName]?.animation === 'fade';

    if (usesFade) {
      screenFadeAnim.setValue(0);
      Animated.timing(screenFadeAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      screenFadeAnim.setValue(1);
    }
  }, [currentRoute.name, screenFadeAnim]);

  const activeNav = useMemo(() => {
    const activeTabRoute = [...routes].reverse().find((route) =>
      PRIMARY_TABS.some((tab) => tab.id === route.name),
    );
    return activeTabRoute?.name ?? 'home';
  }, [routes]);

  const navigate = useCallback((name: AppScreen, book?: BookData) => {
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
    setIsFooterVisible(true);
    setRoutes((current) => [...current, { name, book }]);
  }, [isLoggedIn, lang, showLoginAlert]);

  const handleModalLoginPress = useCallback(() => {
    closeAuthModal();
    navigate('auth');
  }, [closeAuthModal, navigate]);

  const navigateTab = useCallback((name: AppScreen) => {
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
    setIsFooterVisible(true);
    setRoutes([{ name }]);
  }, [isLoggedIn, lang, showLoginAlert]);

  const lastBackPressTime = useRef(0);
  const goBack = useCallback(() => {
    const now = Date.now();
    if (now - lastBackPressTime.current < 450) return;
    lastBackPressTime.current = now;
    setIsFooterVisible(true);
    setRoutes((current) => (current.length > 1 ? current.slice(0, -1) : current));
  }, []);

  const finishLogin = useCallback(() => {
    setSessionActive(true);
    setIsLoggedIn(true);
    const nextRoutes: ScreenRoute[] = [{ name: 'home' }];
    setRoutes(nextRoutes);
    AsyncStorage.setItem('savedRoutes', JSON.stringify(nextRoutes)).catch(() => {});
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routes.length <= 1) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [routes.length]);

  const logout = useCallback(async () => {
    try {
      setSessionActive(false);
      setIsLoggedIn(false);
      await AsyncStorage.multiRemove([
        'userToken',
        'accessToken',
        'refreshToken',
        'userRole',
        'userProfile',
        'savedRoutes',
        'userAvatarUrl',
        'userInitial',
        'currentUsername',
      ]);
      await clearLegacyBookshelfKeys();
      setUserAvatarUrl('');
      setUserInitial('H');
      setRoutes([{ name: 'auth' }]);
    } catch {
      Alert.alert('Không thể đăng xuất', 'Đã xảy ra lỗi khi xóa thông tin đăng nhập.');
    }
  }, []);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Tích hợp Trợ lý AI (HALM.AI) qua API Backend: POST /api/chat
  // - Gửi câu hỏi đến BE kèm token xác thực (nếu đã đăng nhập) hoặc dưới dạng khách (guest)
  // - BE sẽ xử lý qua Spring AI (Gemini Flash + Tool tìm kiếm sách trong database)
  // - Nhận câu trả lời thực tế từ HALM.AI và cập nhật vào danh sách tin nhắn
  // ============================================================================
  const sendChatMessage = async (text: string) => {
    const userTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `${Date.now()}-user`;

    // 1. Thêm tin nhắn người dùng vào danh sách
    setChatMessages((current) => [
      ...current,
      { id: userMsgId, sender: 'user', text, time: userTime },
    ]);

    setIsChatLoading(true);

    try {
      // 2. Lấy token xác thực nếu có
      const token = await AsyncStorage.getItem('userToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 3. Gửi yêu cầu đến API backend POST /api/chat
      const response = await axios.post<{ reply: string }>(
        `${API_BASE_URL}/api/chat`,
        { message: text },
        { headers, timeout: 45000 }
      );

      const botTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const replyText = response.data?.reply || 'Mình đã nhận được tin nhắn của bạn.';

      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot`,
          sender: 'bot',
          text: replyText,
          time: botTime,
        },
      ]);
    } catch (error: any) {
      console.warn('Lỗi gọi API chat:', error);
      const botTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      let errorReply = 'Không thể kết nối đến máy chủ trợ lý HALM.AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.';
      
      if (error?.response?.data?.reply) {
        errorReply = error.response.data.reply;
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorReply = 'HALM.AI phản hồi quá lâu do mạng chậm. Bạn vui lòng thử lại nhé.';
      }

      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot`,
          sender: 'bot',
          text: errorReply,
          time: botTime,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChatMessages = () => {
    setChatMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: lang === 'en'
          ? 'Hello! I am HALM.AI - the smart virtual assistant of HALM BOOK. How can I help you today?'
          : 'Xin chào! Mình là HALM.AI - trợ lý ảo của HALM BOOK. Bạn có thể hỏi mình tìm sách, tư vấn tác phẩm hoặc giải đáp thắc mắc!',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const toggleDarkMode = useCallback(() => setIsDarkMode((current) => !current), []);
  const refreshHome = useCallback(() => setHomeRefreshKey((current) => current + 1), []);

  const navigation = useMemo(
    () => ({
      navigate,
      navigateTab,
      goBack,
      logout,
      isDarkMode,
      toggleDarkMode,
      isFooterVisible,
      setFooterVisible: setIsFooterVisible,
      isLoggedIn: isLoggedIn || isSessionActive(),
      setIsLoggedIn: (val: boolean) => {
        setSessionActive(val);
        setIsLoggedIn(val);
      },
      showLoginAlert,
      userAvatarUrl,
      setUserAvatarUrl,
      userInitial,
      setUserInitial,
      lang,
      setLang,
    }),
    [
      navigate,
      navigateTab,
      goBack,
      logout,
      isDarkMode,
      toggleDarkMode,
      isFooterVisible,
      isLoggedIn,
      showLoginAlert,
      userAvatarUrl,
      userInitial,
      lang,
      setLang,
    ]
  );

  const showSharedHeader = useMemo(
    () => SCREENS_WITH_SHARED_HEADER.includes(currentRoute.name),
    [currentRoute.name]
  );

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
      screen = <TuSach key={`bookshelf_${isLoggedIn}_${userAvatarUrl}`} />;
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
    case 'notifications':
      screen = <ThongBaoScreen onBack={goBack} />;
      break;
    case 'chatbot':
      screen = (
        <ChatBotScreen
          messages={chatMessages}
          isLoading={isChatLoading}
          onBack={goBack}
          onSendMessage={sendChatMessage}
          onClearChat={clearChatMessages}
        />
      );
      break;
    case 'bookDetail':
      screen = currentRoute.book ? (
        <BookDetailScreen
          book={currentRoute.book}
          onBack={goBack}
          onStartReading={(initialChapterIndex) => {
            if (currentRoute.book) {
              addToReadingList({
                id: currentRoute.book.id,
                title: currentRoute.book.title,
                author: currentRoute.book.author,
                chapter: currentRoute.book.chapter,
                img_url: currentRoute.book.img_url,
                coverImage: currentRoute.book.coverImage,
              });
            }
            navigate('reader', {
              ...currentRoute.book,
              id: currentRoute.book?.id || 'book-1',
              title: currentRoute.book?.title || 'Đọc sách',
              initialChapterIndex: typeof initialChapterIndex === 'number' ? initialChapterIndex : 0,
            } as any);
          }}
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
                compact={currentRoute.name === 'offers'}
              />
            )}
            <BlurTargetView
              ref={blurTargetRef}
              style={{ flex: 1, backgroundColor: isDarkMode ? '#101319' : '#fff' }}
            >
              <Animated.View style={{ flex: 1, opacity: screenFadeAnim }}>
                {screen}
              </Animated.View>
            </BlurTargetView>
            {!['auth', 'reader', 'chatbot', 'notifications'].includes(currentRoute.name) && (
              <Footer
                activeNav={activeNav}
                floating={['home', 'bookDetail', 'offers', 'upload', 'bookshelf', 'profile'].includes(currentRoute.name)}
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
          lang={lang}
        />
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
