import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BlurTargetView } from 'expo-blur';
import { ComponentRef, ComponentType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Modal, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatBotScreen, { ChatMessage } from './src/ux-ui/chatbot';
import ReaderLeaderboard from './src/ux-ui/ReaderLeaderboard';
import BookDetailScreen from './src/ux-ui/chitietsach';
import DmTrangChu from './src/ux-ui/dmtrangchu';
import Footer, { PRIMARY_TABS } from './src/ux-ui/footer';
import GioHang from './src/ux-ui/giohang';
import GenreBooksScreen from './src/ux-ui/genreBooks';
import LoginLogout from './src/ux-ui/loginlogout';
import HalmBookHistory from './src/ux-ui/lsgiaodich';
import ManHinhDoc from './src/ux-ui/manhinhdoc';
import { AppLanguage, AppNavigate, AppScreen, BookData, GenreBooksParams, NavigationContext, NavigationOptions } from './src/ux-ui/navigation';
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

interface ScreenRoute extends NavigationOptions {
  name: AppScreen;
  book?: BookData;
  genre?: GenreBooksParams;
  initialBookshelfTab?: 'dangdoc' | 'dangthue' | 'dathue' | 'yeuthich' | 'tailen' | 'duoctang';
}

const SCREENS_WITH_SHARED_HEADER: AppScreen[] = [
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

const LoginLogoutWithSuccess = LoginLogout as ComponentType<{ onLoginSuccess: () => void; onCancel?: () => void }>;

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
    showForm: boolean;
  }>({
    visible: false,
    message: '',
    showForm: false,
  });
  const pendingAuthAction = useRef<(() => void) | null>(null);
  const authEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    authEntrance.setValue(0);
    if (!authModal.showForm) return;
    const animation = Animated.timing(authEntrance, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [authModal.showForm, authEntrance]);

  const showLoginAlert = useCallback((message: string, onAuthenticated?: () => void) => {
    setAuthModal({
      visible: true,
      message,
      showForm: true,
    });
    pendingAuthAction.current = onAuthenticated || null;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('appDarkMode').then((saved) => {
      if (saved === 'true' || saved === 'false') setIsDarkMode(saved === 'true');
    }).catch(() => {});
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthModal((current) => ({ ...current, visible: false, showForm: false }));
    pendingAuthAction.current = null;
  }, []);

  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatRequest = useRef<AbortController | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Mình là HALM.AI - trợ lý ảo của HALM BOOK. Bạn có thể hỏi mình tìm sách, tư vấn tác phẩm hoặc giải đáp thắc mắc!',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Khôi phục phiên đăng nhập nếu có; nếu không thì mở app ở chế độ khách.
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const sessionActive = isSessionActive();

        if (!sessionActive) {
          setSessionActive(false);
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
            setRoutes([{ name: 'home' }]);
            setIsReady(true);
          }
          return;
        }

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
              setRoutes(parsed.filter((route: ScreenRoute) => route.name !== 'auth').length
                ? parsed.filter((route: ScreenRoute) => route.name !== 'auth')
                : [{ name: 'home' }]);
              setIsReady(true);
              return;
            }
          }
          setRoutes([{ name: 'home' }]);
        } else if (isMounted) {
          setIsLoggedIn(false);
          setRoutes([{ name: 'home' }]);
        }
      } catch (err) {
        console.warn('Lỗi khôi phục session Expo:', err);
        if (isMounted) {
          setIsLoggedIn(false);
          setRoutes([{ name: 'home' }]);
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

  const navigate: AppNavigate = useCallback((name: AppScreen, params?: BookData | GenreBooksParams, options?: NavigationOptions) => {
    const book = name === 'genreBooks' ? undefined : params as BookData | undefined;
    const genre = name === 'genreBooks' ? params as GenreBooksParams : undefined;
    const initialBookshelfTab = options?.initialBookshelfTab;
    if (name === 'auth') {
      setAuthModal({ visible: true, message: lang === 'en' ? 'Sign in or create an account to continue.' : 'Đăng nhập hoặc tạo tài khoản để tiếp tục.', showForm: true });
      pendingAuthAction.current = null;
      return;
    }
    if (!isLoggedIn && !isSessionActive()) {
      if (name === 'upload') {
        showLoginAlert(lang === 'en' ? 'Please log in to use upload file feature' : 'Bạn phải đăng nhập mới dùng được chức năng uploadfile', () => {
          setIsFooterVisible(true);
          setRoutes((current) => [...current, { name, book, ...options }]);
        });
        return;
      }
      if (name === 'bookshelf') {
        showLoginAlert(lang === 'en' ? 'Please log in to use bookshelf feature' : 'Bạn phải đăng nhập để dùng chức năng tủ sách', () => {
          setIsFooterVisible(true);
          setRoutes((current) => [...current, { name, book, initialBookshelfTab }]);
        });
        return;
      }
      if (name === 'profile') {
        showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân', () => {
          setIsFooterVisible(true);
          setRoutes((current) => [...current, { name, book, initialBookshelfTab }]);
        });
        return;
      }
      if (name === 'cart') {
        showLoginAlert(lang === 'en' ? 'Please log in to use cart feature' : 'Bạn phải đăng nhập để dùng chức năng giỏ hàng', () => {
          setIsFooterVisible(true);
          setRoutes((current) => [...current, { name, book, initialBookshelfTab }]);
        });
        return;
      }
      if (name === 'payment') {
        showLoginAlert(lang === 'en' ? 'Please log in to proceed to payment' : 'Bạn phải đăng nhập để thanh toán', () => {
          setIsFooterVisible(true);
          setRoutes((current) => [...current, { name, book, initialBookshelfTab }]);
        });
        return;
      }
    }
    setIsFooterVisible(true);
    setRoutes((current) => [...current, { name, book, genre, initialBookshelfTab }]);
  }, [isLoggedIn, lang, showLoginAlert]);

  const handleModalLoginPress = useCallback(() => {
    setAuthModal((current) => ({ ...current, showForm: true }));
  }, []);

  const navigateTab = useCallback((name: AppScreen) => {
    if (!isLoggedIn && !isSessionActive()) {
      if (name === 'upload') {
        showLoginAlert(lang === 'en' ? 'Please log in to use upload file feature' : 'Bạn phải đăng nhập mới dùng được chức năng uploadfile', () => {
          setIsFooterVisible(true);
          setRoutes([{ name }]);
        });
        return;
      }
      if (name === 'bookshelf') {
        showLoginAlert(lang === 'en' ? 'Please log in to use bookshelf feature' : 'Bạn phải đăng nhập để dùng chức năng tủ sách', () => {
          setIsFooterVisible(true);
          setRoutes([{ name }]);
        });
        return;
      }
      if (name === 'profile') {
        showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân', () => {
          setIsFooterVisible(true);
          setRoutes([{ name }]);
        });
        return;
      }
      if (name === 'cart') {
        showLoginAlert(lang === 'en' ? 'Please log in to use cart feature' : 'Bạn phải đăng nhập để dùng chức năng giỏ hàng', () => {
          setIsFooterVisible(true);
          setRoutes([{ name }]);
        });
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
    setAuthModal({ visible: false, message: '', showForm: false });
    const pendingAction = pendingAuthAction.current;
    pendingAuthAction.current = null;
    requestAnimationFrame(() => pendingAction?.());
  }, []);

  const closeAuthForm = useCallback(() => {
    setAuthModal({ visible: false, message: '', showForm: false });
    pendingAuthAction.current = null;
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
      chatRequest.current?.abort();
      chatRequest.current = null;
      setIsChatLoading(false);
      setChatMessages(current => current.filter(message => message.id === 'welcome'));
      setSessionActive(false);
      setIsLoggedIn(false);
      const token = await AsyncStorage.getItem('userToken');
      try {
        if (token) await axios.post(API_BASE_URL + '/api/auth/logout', {}, {
          headers: { Authorization: 'Bearer ' + token }, timeout: 5000,
        });
      } catch { /* Local logout must complete even when the server is unreachable. */ }
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
      setRoutes([{ name: 'home' }]);
    } catch {
      Alert.alert('Không thể đăng xuất', 'Đã xảy ra lỗi khi xóa thông tin đăng nhập.');
    }
  }, []);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Tích hợp Trợ lý AI (HALM.AI) qua API Backend: POST /api/chat
  // - Chỉ gửi câu hỏi khi đã đăng nhập, luôn kèm token xác thực.
  // - BE sẽ xử lý qua Spring AI (Gemini Flash + Tool tìm kiếm sách trong database)
  // - Nhận câu trả lời thực tế từ HALM.AI và cập nhật vào danh sách tin nhắn
  // ============================================================================
  const sendChatMessage = async (text: string) => {
    if (!isLoggedIn || !isSessionActive()) {
      showLoginAlert(lang === 'en' ? 'Please log in to use HALM.AI.' : 'Vui lòng đăng nhập để sử dụng trợ lý HALM.AI.');
      return;
    }
    if (!text.trim() || chatRequest.current) return;
    const controller = new AbortController();
    chatRequest.current = controller;
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (controller.signal.aborted || chatRequest.current !== controller) return;
      if (!token) {
        showLoginAlert(lang === 'en' ? 'Please log in again to use HALM.AI.' : 'Vui lòng đăng nhập lại để sử dụng trợ lý HALM.AI.');
        return;
      }
      const userTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const userMsgId = `${Date.now()}-user`;

      // 1. Thêm tin nhắn người dùng vào danh sách
      setChatMessages((current) => [
        ...current,
        { id: userMsgId, sender: 'user', text, time: userTime },
      ]);

      setIsChatLoading(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 3. Gửi yêu cầu đến API backend POST /api/chat
      const response = await axios.post<{ reply: string }>(
        `${API_BASE_URL}/api/chat`,
        { message: text },
        { headers, timeout: 120000, signal: controller.signal }
      );
      if (controller.signal.aborted || chatRequest.current !== controller) return;

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
      if (controller.signal.aborted || chatRequest.current !== controller) return;
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        showLoginAlert(lang === 'en' ? 'Please log in again to use HALM.AI.' : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để sử dụng HALM.AI.');
        return;
      }
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
      if (chatRequest.current === controller) {
        chatRequest.current = null;
        setIsChatLoading(false);
      }
    }
  };

  const clearChatMessages = async () => {
    if (chatRequest.current) return;
    const controller = new AbortController();
    chatRequest.current = controller;
    setIsChatLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { showLoginAlert('Vui lòng đăng nhập lại để xóa lịch sử.'); return; }
      await axios.delete(API_BASE_URL + '/api/chat/history', {
        headers: { Authorization: 'Bearer ' + token }, signal: controller.signal, timeout: 10000,
      });
      if (!controller.signal.aborted && chatRequest.current === controller) {
        setChatMessages(current => current.filter(message => message.id === 'welcome'));
      }
    } catch {
      if (!controller.signal.aborted) Alert.alert('Chưa xóa được lịch sử', 'Vui lòng thử lại khi kết nối ổn định.');
    } finally {
      if (chatRequest.current === controller) { chatRequest.current = null; setIsChatLoading(false); }
    }
  };

  useEffect(() => {
    if (!isLoggedIn || currentRoute.name !== 'chatbot' || chatRequest.current) return;
    const controller = new AbortController();
    chatRequest.current = controller;
    setIsChatLoading(true);
    void (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token || controller.signal.aborted) return;
        const response = await axios.get<{ id: number; sender: 'user' | 'bot'; content: string; sentAt?: string }[]>(API_BASE_URL + '/api/chat/history', {
          headers: { Authorization: 'Bearer ' + token }, signal: controller.signal, timeout: 10000,
        });
        if (controller.signal.aborted || chatRequest.current !== controller) return;
        setChatMessages(current => [...current.filter(message => message.id === 'welcome'), ...response.data.map(row => ({
          id: String(row.id), sender: row.sender, text: row.content,
          time: row.sentAt ? new Date(row.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
        }))]);
      } catch {
        if (!controller.signal.aborted) Alert.alert('Chưa tải được lịch sử', 'Vui lòng thử mở lại hội thoại.');
      } finally {
        if (chatRequest.current === controller) { chatRequest.current = null; setIsChatLoading(false); }
      }
    })();
    return () => {
      controller.abort();
      if (chatRequest.current === controller) { chatRequest.current = null; setIsChatLoading(false); }
    };
  }, [isLoggedIn, currentRoute.name]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((current) => {
      const next = !current;
      AsyncStorage.setItem('appDarkMode', String(next)).catch(() => {});
      return next;
    });
  }, []);
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
      screen = <TuSach key={`bookshelf_${isLoggedIn}_${userAvatarUrl}_${currentRoute.initialBookshelfTab ?? 'dangdoc'}`} initialTab={currentRoute.initialBookshelfTab} />;
      break;
    case 'profile':
      screen = <TrangCaNhan />;
      break;
    case 'categories':
      screen = <TheLoai />;
      break;
    case 'genreBooks':
      screen = <GenreBooksScreen key={currentRoute.genre?.categoryId} genre={currentRoute.genre} />;
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
      screen = <ManHinhDoc key={currentRoute.book?.id} onBack={goBack} book={currentRoute.book} />;
      break;
    case 'payment':
      screen = <ThanhToan />;
      break;
    case 'notifications':
      screen = <ThongBaoScreen onBack={goBack} />;
      break;
    case 'leaderboard':
      screen = <ReaderLeaderboard />;
      break;
    case 'chatbot':
      screen = !isLoggedIn ? <LoginLogoutWithSuccess onLoginSuccess={finishLogin} /> : (
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
            const requestedChapterIndex = typeof initialChapterIndex === 'number' ? initialChapterIndex : 0;
            const safeChapterIndex = (!isLoggedIn && !isSessionActive())
              ? Math.min(Math.max(0, requestedChapterIndex), 2)
              : requestedChapterIndex;
            if (!isLoggedIn && !isSessionActive() && requestedChapterIndex > 2) {
              showLoginAlert(
                'Đăng nhập để tiếp tục đến chương này. Khách có thể đọc thử 3 chương đầu.',
                () => setRoutes((current) => [
                  ...current,
                  {
                    name: 'reader',
                    book: {
                      ...currentRoute.book,
                      id: currentRoute.book?.id || 'book-1',
                      title: currentRoute.book?.title || 'Đọc sách',
                      initialChapterIndex: 2,
                    } as any,
                  },
                ])
              );
              return;
            }
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
              initialChapterIndex: typeof safeChapterIndex === 'number' ? safeChapterIndex : 0,
            } as any);
          }}
        />
      ) : null;
      break;
  }

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#181716' : '#fff' }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContext.Provider value={navigation}>
        {currentRoute.name === 'auth' ? null : (
          <View
            style={{
              flex: 1,
              backgroundColor:
                currentRoute.name === 'cart'
                  ? isDarkMode
                    ? '#242321'
                    : '#FFFFFF'
                  : currentRoute.name === 'payment'
                    ? isDarkMode
                      ? '#181716'
                      : '#F7F5F0'
                    : isDarkMode ? '#181716' : '#FFFFFF',
            }}
          >
            {showSharedHeader && (
              <SharedHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                blurTarget={blurTargetRef}
                currentScreen={currentRoute.name}
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
            {!['auth', 'reader', 'chatbot', 'notifications', 'payment', 'transactions'].includes(currentRoute.name) && (
              <Footer
                activeNav={activeNav}
                floating={['home', 'categories', 'genreBooks', 'bookDetail', 'offers', 'upload', 'bookshelf', 'profile'].includes(currentRoute.name)}
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
          visible={authModal.visible && !authModal.showForm}
          message={authModal.message}
          onClose={closeAuthPrompt}
          onLogin={handleModalLoginPress}
          isDarkMode={isDarkMode}
          lang={lang}
        />
        <Modal
          visible={authModal.showForm}
          transparent
          animationType="fade"
          onRequestClose={closeAuthForm}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 }}>
            <Animated.View style={{ width: '100%', maxWidth: 480, maxHeight: '92%', flexShrink: 1, alignSelf: 'center', overflow: 'hidden', borderRadius: 18,
              opacity: authEntrance,
              transform: [
                { translateY: authEntrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                { scale: authEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
            }}>
              <LoginLogoutWithSuccess onLoginSuccess={finishLogin} onCancel={closeAuthForm} />
            </Animated.View>
          </View>
        </Modal>
      </NavigationContext.Provider>
    </SafeAreaProvider>
  );
}
