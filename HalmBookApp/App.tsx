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

interface ScreenRoute {
  name: AppScreen;
  book?: BookData;
}

const DEFAULT_BOOK: BookData = {
  id: 'demo-book',
  title: 'Lưu Viện Quan Trung',
  author: 'Đang cập nhật',
  chapter: 'Full 500 Chương',
  tag: 'Tiên Hiệp',
  rating: '4.9',
  reads: '15K',
};

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
  const [routes, setRoutes] = useState<ScreenRoute[]>([{ name: 'auth' }]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Mình là trợ lý HALM. Bạn cần hỗ trợ gì?',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const currentRoute = routes[routes.length - 1];
  const activeTabRoute = [...routes].reverse().find((route) =>
    PRIMARY_TABS.some((tab) => tab.id === route.name),
  );
  const activeNav = activeTabRoute?.name ?? 'home';

  const navigate = (name: AppScreen, book?: BookData) => {
    setRoutes((current) => [...current, { name, book }]);
  };

  const navigateTab = (name: AppScreen) => {
    setRoutes([{ name }]);
  };

  const goBack = () => {
    setRoutes((current) => current.length > 1 ? current.slice(0, -1) : current);
  };

  const finishLogin = () => setRoutes([{ name: 'home' }]);

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
      await AsyncStorage.multiRemove(['userToken', 'userRole']);
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

  const navigation = { navigate, navigateTab, goBack, logout, isDarkMode };
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
      screen = (
        <BookDetailScreen
          book={currentRoute.book ?? DEFAULT_BOOK}
          onBack={goBack}
          onStartReading={() => navigate('reader')}
        />
      );
      break;
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
            <Footer activeNav={activeNav} floating={currentRoute.name === 'home'} />
          </View>
        )}
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
