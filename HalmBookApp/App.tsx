import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurTargetView } from 'expo-blur';
import { ComponentRef, ComponentType, useEffect, useRef, useState } from 'react';
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

interface ScreenRoute {
  name: AppScreen;
  book?: BookData;
}

const SCREENS_WITH_SHARED_HEADER: AppScreen[] = [
  'upload',
  'bookshelf',
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
  const [isLoggedInState, setIsLoggedInState] = useState<boolean>(isSessionActive());
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');
  const [userInitial, setUserInitial] = useState<string>('H');

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
          await AsyncStorage.multiRemove([
            'userToken',
            'accessToken',
            'refreshToken',
            'userRole',
            'userProfile',
            'savedRoutes',
          ]);
          if (isMounted) {
            setIsLoggedInState(false);
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
          setIsLoggedInState(true);
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
          setIsLoggedInState(false);
          setRoutes([{ name: 'auth' }]);
        }
      } catch (err) {
        console.warn('Lỗi khôi phục session Expo:', err);
        if (isMounted) {
          setIsLoggedInState(false);
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

  const activeTabRoute = [...routes].reverse().find((route) =>
    PRIMARY_TABS.some((tab) => tab.id === route.name),
  );
  const activeNav = activeTabRoute?.name ?? 'home';

  const navigate = (name: AppScreen, book?: BookData) => {
    setIsFooterVisible(true);
    setRoutes((current) => [...current, { name, book }]);
  };

  const navigateTab = (name: AppScreen) => {
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
    setIsLoggedInState(true);
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
      setIsLoggedInState(false);
      await AsyncStorage.multiRemove([
        'userToken',
        'accessToken',
        'refreshToken',
        'userRole',
        'userProfile',
        'savedRoutes',
      ]);
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
    isLoggedIn: isLoggedInState || isSessionActive(),
    setIsLoggedIn: (val: boolean) => {
      setSessionActive(val);
      setIsLoggedInState(val);
    },
    userAvatarUrl,
    setUserAvatarUrl,
    userInitial,
    setUserInitial,
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
              <Animated.View style={{ flex: 1, opacity: screenFadeAnim }}>
                {screen}
              </Animated.View>
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
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
