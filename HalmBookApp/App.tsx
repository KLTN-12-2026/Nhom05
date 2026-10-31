import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurTargetView } from 'expo-blur';
import { ComponentType, useEffect, useRef, useState } from 'react';
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

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:8082`;

const CANDIDATE_API_URLS = [
  process.env.EXPO_PUBLIC_API_URL,
  `http://${localhost}:8082`,
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://10.0.2.2:8082',
].filter(Boolean) as string[];

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    let output = '';
    for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++));) {
      const pos = chars.indexOf(buffer);
      if (pos === -1) continue;
      bs = bc % 4 ? bs * 64 + pos : pos;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    return JSON.parse(output);
  } catch {
    return null;
  }
};

export default function App() {
  const [routes, setRoutes] = useState<ScreenRoute[]>([{ name: 'auth' }]);
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const blurTargetRef = useRef<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Mình là trợ lý HALM. Bạn cần hỗ trợ gì?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Khôi phục phiên đăng nhập và kiểm tra tính hợp lệ của token
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          if (isMounted) {
            setRoutes([{ name: 'auth' }]);
            setIsReady(true);
          }
          return;
        }

        // 1. Kiểm tra hạn sử dụng JWT Token (exp) - Token sống 1 ngày
        const jwtPayload = decodeJwtPayload(token);
        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (!jwtPayload || !jwtPayload.exp || nowInSeconds >= jwtPayload.exp) {
          console.warn('Token đã hết hạn (> 1 ngày) hoặc không hợp lệ. Yêu cầu đăng nhập.');
          await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes', 'cachedUserProfile']);
          if (isMounted) {
            setRoutes([{ name: 'auth' }]);
            setIsReady(true);
          }
          return;
        }

        // 2. Xác thực trực tiếp với Backend để kiểm tra server có đang chạy và chấp nhận token không
        let isTokenValidOnBackend = false;
        const urls = CANDIDATE_API_URLS.filter((url, idx, arr) => arr.indexOf(url) === idx);
        for (const baseUrl of urls) {
          try {
            const res = await axios.get(`${baseUrl}/api/home/customer/info`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 3000,
            });
            if (res.status === 200) {
              isTokenValidOnBackend = true;
              break;
            }
          } catch (err: any) {
            if (err?.response?.status === 404) {
              // 404: Token hoàn toàn hợp lệ, chỉ là tài khoản chưa có bản ghi customer
              isTokenValidOnBackend = true;
              break;
            }
            if (err?.response?.status === 401) {
              // Backend từ chối xác thực vì token hết hạn hoặc sai
              isTokenValidOnBackend = false;
              break;
            }
          }
        }

        if (!isTokenValidOnBackend) {
          console.warn('Backend từ chối token hoặc chưa sẵn sàng. Yêu cầu đăng nhập đầu tiên.');
          await AsyncStorage.multiRemove(['userToken', 'userRole', 'savedRoutes', 'cachedUserProfile']);
          if (isMounted) {
            setRoutes([{ name: 'auth' }]);
            setIsReady(true);
          }
          return;
        }

        // 3. Token hoàn toàn hợp lệ và Backend đang chạy -> Giữ nguyên phiên khi Expo reload
        if (isMounted) {
          const savedRoutesStr = await AsyncStorage.getItem('savedRoutes');
          if (savedRoutesStr) {
            try {
              const parsed = JSON.parse(savedRoutesStr);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setRoutes(parsed);
                setIsReady(true);
                return;
              }
            } catch {}
          }
          setRoutes([{ name: 'home' }]);
          setIsReady(true);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra session:', err);
        if (isMounted) {
          setRoutes([{ name: 'auth' }]);
          setIsReady(true);
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

  const goBack = () => {
    setIsFooterVisible(true);
    setRoutes((current) => current.length > 1 ? current.slice(0, -1) : current);
  };

  const finishLogin = () => {
    const nextRoutes: ScreenRoute[] = [{ name: 'home' }];
    setRoutes(nextRoutes);
    AsyncStorage.setItem('savedRoutes', JSON.stringify(nextRoutes)).catch(() => {});
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routes.length <= 1) return false;
      setRoutes((current) => current.length > 1 ? current.slice(0, -1) : current);
      return true;
    });
    return () => subscription.remove();
  }, [routes.length]);

  const logout = async () => {
    try {
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

  const navigation = {
    navigate,
    navigateTab,
    goBack,
    logout,
    isDarkMode,
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
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
