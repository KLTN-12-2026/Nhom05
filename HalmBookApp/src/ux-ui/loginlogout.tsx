import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setCurrentUsername,
  extractUsernameFromToken,
  clearLegacyBookshelfKeys,
  clearUserDataForAccount,
  recordUserInDirectory,
} from './userStorage';
import { fetchFavoriteBooksFromApi } from './favoriteService';
import axios from 'axios';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Client ID Google OAuth (đồng bộ với Web Frontend HalmBookFE)
const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.EXPO_GOOGLE_CLIENT_ID ||
  '994619857768-6ipg7lvdn9voai235f4e7gdtheuclds4.apps.googleusercontent.com';

import { API_BASE_URL } from './apiService';

const axiosAppInstance = axios.create({
  baseURL: API_BASE_URL,
});

type ScreenState = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

interface AuthProps {
  onLoginSuccess: () => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { isDarkMode, goBack, lang } = useAppNavigation();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  const showSuccess = (message: string, onComplete: () => void) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setSuccessMessage(message);
    transitionTimer.current = setTimeout(() => {
      setSuccessMessage('');
      transitionTimer.current = null;
      onComplete();
    }, 1500);
  };

  // ----------------------------------------------------
  // QUẢN LÝ DỮ LIỆU (STATE)
  // ----------------------------------------------------
  // State Đăng nhập
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State Đăng ký
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // State Quên Mật Khẩu (Dùng chung xuyên suốt 3 màn hình)
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');


  // ============================================================================
  // [GIẢI THÍCH CODE]: SERVICE XỬ LÝ ĐĂNG NHẬP GOOGLE BẰNG API BACKEND CÓ SẴN
  // 1. Phía Backend Spring Boot có API: POST /api/auth/google
  //    - Nhận body JSON: SocialLoginRequest { token: "<access_token>" }
  //    - Backend AuthServiceImpl: Gọi Google UserInfo API:
  //      https://www.googleapis.com/oauth2/v3/userinfo?access_token=<token>
  //    - Tự động lấy email, tên, ảnh đại diện, lưu/tìm trong database
  //    - Trả về: AuthResponse { systemToken, account, customer, role }
  // 2. Phía Mobile App:
  //    - Dùng WebBrowser.openAuthSessionAsync mở luồng Google OAuth2 (Implicit Flow)
  //    - Google trả về URL chứa fragment '#access_token=ya29...'
  //    - Trích xuất `access_token` và gửi thẳng lên API /api/auth/google của Backend
  //    - Lấy JWT token từ `systemToken` lưu vào AsyncStorage
  //    - Kích hoạt onLoginSuccess chuyển vào màn hình chính
  // ============================================================================
  // Gửi Google access_token về Backend xác thực giống HalmBookFE
  const sendGoogleTokenToBackend = async (accessToken: string) => {
    try {
      const response = await axiosAppInstance.post('/api/auth/google', {
        token: accessToken,
      });

      const token = response.data?.systemToken || response.data?.token;
      const role = response.data?.role;

      if (typeof token !== 'string' || !token) {
        Alert.alert('Đăng nhập thất bại', 'Phản hồi từ máy chủ không có mã xác thực JWT.');
        setIsGoogleSubmitting(false);
        return;
      }

      await AsyncStorage.setItem('userToken', token);
      if (role) await AsyncStorage.setItem('userRole', role);

      const googleUsername = extractUsernameFromToken(token);
      if (googleUsername) {
        await setCurrentUsername(googleUsername);
      }
      await clearLegacyBookshelfKeys();

      // [GIẢI THÍCH CODE]: Lấy avatar & họ tên từ DB để đồng bộ cho các màn được chỉ định
      try {
        const custRes = await axiosAppInstance.get('/api/home/customer/info', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });
        if (custRes.data) {
          const avatar = custRes.data.avatarUrl || custRes.data.avatar || '';
          const name = custRes.data.customerName || '';
          const initial = (name || 'H').charAt(0).toUpperCase();
          if (avatar) await AsyncStorage.setItem('userAvatarUrl', avatar);
          await AsyncStorage.setItem('userInitial', initial);
        }
      } catch (custErr) {
        // Bỏ qua nếu mạng yếu
      }

      // [GIẢI THÍCH CODE]: Tự động tải trước danh sách sách yêu thích từ MySQL về App
      fetchFavoriteBooksFromApi().catch(() => {});

      showSuccess('Đăng nhập Google thành công! Chào mừng bạn đến với HALM BOOK.', onLoginSuccess);
    } catch (error: any) {
      console.error('Lỗi Backend xác thực Google:', error);
      const errorMsg = error.response?.data || error.message || 'Xác thực Google thất bại ở máy chủ.';
      Alert.alert('Đăng nhập thất bại', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // ============================================================================
  // [GIẢI THÍCH CODE]: SERVICE XỬ LÝ ĐĂNG NHẬP GOOGLE BẰNG API BACKEND CÓ SẴN
  // 1. Phía Backend Spring Boot có API: POST /api/auth/google
  //    - Nhận body JSON: SocialLoginRequest { token: "<access_token>" }
  //    - Backend AuthServiceImpl: Gọi Google UserInfo API để lấy email, name, avatar
  //    - Trả về: AuthResponse { systemToken, account, customer, role }
  // 2. Phía Client:
  //    - Khi chạy Web: dùng Google Identity Services (GSI popup) giống hệt HalmBookFE
  //    - Khi chạy Mobile: dùng WebBrowser.openAuthSessionAsync
  // ============================================================================
  const handleGoogleLogin = async () => {
    if (isLoginSubmitting || isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);

    // --- CÁCH 1: NẾU ĐANG CHẠY TRÊN WEB (Áp dụng đúng cơ chế của HalmBookFE) ---
    if (Platform.OS === 'web' && typeof (window as any)?.google?.accounts?.oauth2 !== 'undefined') {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setIsGoogleSubmitting(false);
              Alert.alert('Đăng nhập Google thất bại', tokenResponse.error_description || tokenResponse.error);
              return;
            }
            if (tokenResponse?.access_token) {
              await sendGoogleTokenToBackend(tokenResponse.access_token);
            } else {
              setIsGoogleSubmitting(false);
            }
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (webErr) {
        console.warn('Lỗi GSI web popup, chuyển sang fallback WebBrowser:', webErr);
      }
    }

    // --- CÁCH 2: NẾU ĐANG CHẠY TRÊN MOBILE APP (Dùng WebBrowser Session) ---
    try {
      const redirectUrl = Linking.createURL('google-auth');
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&prompt=select_account`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const tokenMatch = result.url.match(/[#?&]access_token=([^&]+)/);
        const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

        if (!accessToken) {
          Alert.alert('Đăng nhập thất bại', 'Không nhận được access token từ Google.');
          setIsGoogleSubmitting(false);
          return;
        }

        await sendGoogleTokenToBackend(accessToken);
      } else {
        setIsGoogleSubmitting(false);
      }
    } catch (error: any) {
      console.error('Lỗi khi đăng nhập Google:', error);
      const errorMsg = error.response?.data || error.message || 'Xác thực Google thất bại ở máy chủ.';
      Alert.alert('Đăng nhập Google thất bại', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      setIsGoogleSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // SERVICE 1 : ĐĂNG NHẬP
  // ----------------------------------------------------
  const handleLogin = async () => {
    // 1. Tiền xử lý: Dọn dẹp khoảng trắng
    const userVal = loginUsername.trim();
    const passVal = loginPassword.trim();

    // 2. Validate cơ bản để giảm tải cho Server
    if (!userVal || !passVal) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    if (isLoginSubmitting) return;
    setIsLoginSubmitting(true);

    try {
      // 3. Gọi API đăng nhập (Gửi JSON) 
      const response = await axiosAppInstance.post("/api/auth/login", {
        username: userVal,
        password: passVal
      });

      // Mặc định Spring Boot (JWT) sẽ trả token về ở response.data.token
      // (Bạn cần kiểm tra lại Backend xem key chính xác là gì)
      const token = response.data.token;
      const role = response.data.role; // Lấy role nếu có

      if (typeof token !== 'string' || !token) {
        Alert.alert("Đăng nhập thất bại", "Phản hồi đăng nhập không có mã xác thực.");
        setIsLoginSubmitting(false);
        return;
      }

      // 4. LƯU TRỮ VĨNH VIỄN VÀO ĐIỆN THOẠI
      await AsyncStorage.setItem('userToken', token);
      if (role) await AsyncStorage.setItem('userRole', role);
      if (userVal) await AsyncStorage.setItem('username', userVal);

      const loginUsername = extractUsernameFromToken(token) || userVal;
      if (loginUsername) {
        await setCurrentUsername(loginUsername);
      }
      await clearLegacyBookshelfKeys();

      // [GIẢI THÍCH CODE]: Lấy avatar & họ tên từ DB để đồng bộ cho các màn được chỉ định
      try {
        const custRes = await axiosAppInstance.get('/api/home/customer/info', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });
        if (custRes.data) {
          const avatar = custRes.data.avatarUrl || custRes.data.avatar || '';
          const name = custRes.data.customerName || userVal;
          const initial = (name || userVal || 'H').charAt(0).toUpperCase();
          const custId = custRes.data.customer_id || '';
          if (avatar) await AsyncStorage.setItem('userAvatarUrl', avatar);
          await AsyncStorage.setItem('userInitial', initial);
          if (custId) await AsyncStorage.setItem('@halm_current_customer_id', custId);
          recordUserInDirectory({
            id: custId || userVal,
            customerId: custId,
            name: name,
            username: userVal,
          }).catch(() => {});
        } else {
          const initial = (userVal || 'H').charAt(0).toUpperCase();
          await AsyncStorage.setItem('userInitial', initial);
        }
      } catch (custErr) {
        const initial = (userVal || 'H').charAt(0).toUpperCase();
        await AsyncStorage.setItem('userInitial', initial);
      }

      // [GIẢI THÍCH CODE]: Tự động tải trước danh sách sách yêu thích từ MySQL về App
      fetchFavoriteBooksFromApi().catch(() => {});

      showSuccess('Đăng nhập thành công! Chào mừng bạn đến với HALM BOOK.', onLoginSuccess);

    } catch (error: any) {
      // 5. Bắt lỗi chuẩn mực
      const errorMsg = error.response?.data || "lỗi đăng nhập. Vui lòng thử lại.";
      Alert.alert("Đăng nhập thất bại", errorMsg);
      setIsLoginSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // SERVICE 2 : ĐĂNG KÝ
  // ----------------------------------------------------
  const handleRegister = async () => {
    const userVal = regUsername.trim();
    const emailVal = regEmail.trim();

    // 1. Validate phòng thủ nhiều lớp
    if (!userVal || !emailVal || !regPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      // 2. Định dạng cục Payload đẩy lên Server
      const payload = {
        username: userVal,
        email: emailVal,
        password: regPassword
      };

      // 3. Thực thi API
      await axiosAppInstance.post("/api/auth/register", payload);

      // [GIẢI THÍCH CODE]: Đảm bảo tài khoản mới tạo có Tủ sách hoàn toàn sạch 100%
      await clearUserDataForAccount(userVal);
      recordUserInDirectory({ id: userVal, customerId: '', name: userVal, username: userVal }).catch(() => {});

      Alert.alert("Thành công", "Đăng ký tài khoản thành công! Vui lòng đăng nhập.", [
        {
          text: "OK",
          onPress: () => {
            // Dọn dẹp form
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            setRegConfirmPassword('');
            // Chuyển màn hình
            setCurrentScreen('login');
          }
        }
      ]);

    } catch (error: any) {
      const errorMsg = error.response?.data || "Đăng ký thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMsg);
    }
  };
  // SERVICE 3: QUÊN MẬT KHẨU (GỬI MÃ OTP)
  // ----------------------------------------------------
  const handleSendOTP = async () => {
    const emailVal = forgotEmail.trim();
    if (!emailVal) {
      Alert.alert("Lỗi", "Vui lòng nhập Email của bạn.");
      return;
    }

    try {
      await axiosAppInstance.post("/api/password/send-otp", { email: emailVal });
      Alert.alert("Thành công", `Đã gửi mã OTP tới ${emailVal}`);
      setCurrentScreen('otp'); // Chuyển sang màn nhập OTP
    } catch (error: any) {
      const errorMsg = error.response?.data || "Lỗi gửi OTP. Không tìm thấy Email này.";
      Alert.alert("Lỗi", errorMsg);
    }
  };

  // ----------------------------------------------------
  // SERVICE 4: XÁC THỰC MÃ OTP
  // ----------------------------------------------------
  const handleVerifyOTP = async () => {
    if (otpCode.trim().length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    try {
      await axiosAppInstance.post("/api/password/verify-otp", {
        email: forgotEmail.trim(),
        otp: otpCode.trim()
      });

      Alert.alert("Thành công", "Mã OTP chính xác!");
      setCurrentScreen('reset'); // Chuyển sang màn đổi pass
    } catch (error: any) {
      const errorMsg = error.response?.data || "Mã OTP không đúng hoặc đã hết hạn.";
      Alert.alert("Lỗi", errorMsg);
    }
  };

  // ----------------------------------------------------
  // SERVICE 5: ĐẶT LẠI MẬT KHẨU MỚI
  // ----------------------------------------------------
  const handleResetPassword = async () => {
    if (resetPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu cần có ít nhất 6 ký tự.");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      await axiosAppInstance.post("/api/password/reset-password", {
        email: forgotEmail.trim(),
        newPassword: resetPassword
      });

      Alert.alert("Thành công", "Đổi mật khẩu thành công! Hãy đăng nhập lại.", [
        {
          text: "OK",
          onPress: () => {
            // Dọn dẹp dữ liệu rác để bảo mật
            setForgotEmail(''); setOtpCode(''); setResetPassword(''); setResetConfirmPassword('');
            setCurrentScreen('login');
          }
        }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data || "Đổi mật khẩu thất bại.";
      Alert.alert("Lỗi", errorMsg);
    }
  };

  // Render Logo
  const renderHeader = () => (
    <View style={themeStyles.headerContainer}>
      <Text style={themeStyles.logoText}>HALM <Text style={{ color: '#9b51e0' }}>BOOK</Text></Text>
      <Text style={themeStyles.sloganText}>{lang === 'en' ? 'Discover the world through every page' : 'Khám phá thế giới qua từng trang sách'}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={themeStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar {...({ translucent: true, backgroundColor: "transparent" } as any)} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Background Trang trí */}
      <View style={themeStyles.bgCircleTop} />
      <View style={themeStyles.bgCircleBottom} />

      <ScrollView contentContainerStyle={themeStyles.scrollContent} showsVerticalScrollIndicator={false}>

        {renderHeader()}

        <View style={themeStyles.card}>

          {/* ===================== MÀN HÌNH ĐĂNG NHẬP ===================== */}
          {currentScreen === 'login' && (
            <View style={themeStyles.formContainer}>
              {/* ============================================================================
                  [GIẢI THÍCH CODE]: Nút quay lại dành cho khách vãng lai
                  Nếu khách chưa muốn đăng nhập lúc này, có thể nhấn nút quay lại để về Trang chủ
                  ============================================================================ */}
              <TouchableOpacity
                onPress={() => goBack()}
                style={themeStyles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
              >
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#1a1a1a'} />
              </TouchableOpacity>
              <Text style={themeStyles.authTitle}>{lang === 'en' ? 'Sign In' : 'Đăng nhập'}</Text>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder={lang === 'en' ? 'Username' : 'Tên đăng nhập'}
                  placeholderTextColor="#a4b0be"
                  value={loginUsername} // Gắn dây diện lấy dữ liệu
                  onChangeText={setLoginUsername} // Gắn sự kiện thay đổi
                  autoCapitalize="none" // Chống tự động viết hoa chữ cái đầu (rất dễ sai tên đăng nhập)
                />
              </View>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder={lang === 'en' ? 'Password' : 'Mật khẩu'}
                  placeholderTextColor="#a4b0be"
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
              </View>

              <View style={themeStyles.formActions}>
                <TouchableOpacity onPress={() => setCurrentScreen('forgot')}>
                  <Text style={themeStyles.linkText}>{lang === 'en' ? 'Forgot password?' : 'Quên mật khẩu?'}</Text>
                </TouchableOpacity>
              </View>

              {/* BẮN SỰ KIỆN: Gắn hàm handleLogin vào nút bấm */}
              <TouchableOpacity style={themeStyles.btnSubmit} onPress={handleLogin} disabled={isLoginSubmitting}>
                <Text style={themeStyles.btnSubmitText}>{isLoginSubmitting ? (lang === 'en' ? 'Signing in...' : 'Đang đăng nhập...') : 'Here We Go'}</Text>
              </TouchableOpacity>

              <View style={themeStyles.dividerBox}>
                <View style={themeStyles.dividerLine} />
                <Text style={themeStyles.dividerText}>{lang === 'en' ? 'Or sign in with' : 'Hoặc đăng nhập bằng'}</Text>
                <View style={themeStyles.dividerLine} />
              </View>

              <View style={themeStyles.socialLogins}>
                <TouchableOpacity style={themeStyles.socialBtn}><Ionicons name="logo-google" size={22} color="#DB4437" /></TouchableOpacity>
                <TouchableOpacity style={themeStyles.socialBtn}><Ionicons name="logo-facebook" size={22} color="#1877F2" /></TouchableOpacity>
                <TouchableOpacity style={themeStyles.socialBtn}><Ionicons name="logo-apple" size={22} color="#000" /></TouchableOpacity>
              </View>

              <View style={themeStyles.switchFormText}>
                <Text style={themeStyles.mutedText}>{lang === 'en' ? "Don't have an account? " : 'Chưa có tài khoản? '}</Text>
                <TouchableOpacity onPress={() => setCurrentScreen('register')}>
                  <Text style={themeStyles.boldLinkText}>{lang === 'en' ? 'Sign up now' : 'Đăng ký ngay'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===================== MÀN HÌNH ĐĂNG KÝ ===================== */}
          {currentScreen === 'register' && (
            <View style={themeStyles.formContainer}>
              <Text style={themeStyles.authTitle}>{lang === 'en' ? 'Sign Up' : 'Đăng ký'}</Text>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Tên đăng nhập"
                  placeholderTextColor="#a4b0be"
                  value={regUsername}
                  onChangeText={setRegUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="mail-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Email"
                  placeholderTextColor="#a4b0be"
                  keyboardType="email-address"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                />
              </View>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#a4b0be"
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
              </View>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#a4b0be"
                  secureTextEntry
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                />
              </View>

              {/* BẮN SỰ KIỆN: Gắn hàm handleRegister vào nút bấm */}
              <TouchableOpacity style={[themeStyles.btnSubmit, { marginTop: 10 }]} onPress={handleRegister}>
                <Text style={themeStyles.btnSubmitText}>Here We Go</Text>
              </TouchableOpacity>

              <View style={[themeStyles.switchFormText, { marginTop: 20 }]}>
                <Text style={themeStyles.mutedText}>{lang === 'en' ? 'Already have an account? ' : 'Đã có tài khoản? '}</Text>
                <TouchableOpacity onPress={() => setCurrentScreen('login')}>
                  <Text style={themeStyles.boldLinkText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CÁC MÀN HÌNH KHÁC (FORGOT, OTP, RESET) giữ nguyên như cũ... */}
          {/* ===================== BƯỚC 1: QUÊN MẬT KHẨU ===================== */}
          {currentScreen === 'forgot' && (
            <View style={themeStyles.formContainer}>
              <TouchableOpacity onPress={() => setCurrentScreen('login')} style={themeStyles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={themeStyles.authTitle}>Quên mật khẩu</Text>
              <Text style={themeStyles.instructionText}>Vui lòng nhập Email để nhận mã xác thực (OTP).</Text>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="mail-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Nhập Email của bạn"
                  placeholderTextColor="#a4b0be"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
              </View>

              <TouchableOpacity style={themeStyles.btnSubmit} onPress={handleSendOTP}>
                <Text style={themeStyles.btnSubmitText}>Gửi mã OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===================== BƯỚC 2: NHẬP MÃ OTP ===================== */}
          {currentScreen === 'otp' && (
            <View style={themeStyles.formContainer}>
              <TouchableOpacity onPress={() => setCurrentScreen('forgot')} style={themeStyles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={themeStyles.authTitle}>Nhập mã OTP</Text>
              <Text style={themeStyles.instructionText}>Mã 6 chữ số đã được gửi đến {forgotEmail}</Text>

              {/* Đã tái cấu trúc: 1 ô nhập duy nhất, UX mượt mà, giãn chữ mô phỏng 6 ô */}
              <View style={themeStyles.inputGroup}>
                <TextInput
                  style={[themeStyles.input, { fontSize: 22, fontWeight: 'bold', letterSpacing: 15, textAlign: 'center' }]}
                  placeholder="••••••"
                  placeholderTextColor="#a4b0be"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>

              <TouchableOpacity style={themeStyles.btnSubmit} onPress={handleVerifyOTP}>
                <Text style={themeStyles.btnSubmitText}>Xác nhận</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={handleSendOTP}>
                <Text style={themeStyles.linkText}>Gửi lại mã</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===================== BƯỚC 3: ĐẶT LẠI MẬT KHẨU ===================== */}
          {currentScreen === 'reset' && (
            <View style={themeStyles.formContainer}>
              <TouchableOpacity onPress={() => setCurrentScreen('login')} style={themeStyles.backBtn}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={themeStyles.authTitle}>Tạo mật khẩu mới</Text>
              <Text style={themeStyles.instructionText}>Vui lòng tạo mật khẩu mới cho tài khoản của bạn.</Text>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Mật khẩu mới"
                  placeholderTextColor="#a4b0be"
                  secureTextEntry
                  value={resetPassword}
                  onChangeText={setResetPassword}
                />
              </View>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Xác nhận mật khẩu mới"
                  placeholderTextColor="#a4b0be"
                  secureTextEntry
                  value={resetConfirmPassword}
                  onChangeText={setResetConfirmPassword}
                />
              </View>

              <TouchableOpacity style={themeStyles.btnSubmit} onPress={handleResetPassword}>
                <Text style={themeStyles.btnSubmitText}>Cập nhật mật khẩu</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      {!!successMessage && (
        <View style={themeStyles.successToast} accessibilityRole="alert">
          <View style={themeStyles.successToastIcon}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
          <View style={themeStyles.successToastContent}>
            <Text style={themeStyles.successToastTitle}>Thành công</Text>
            <Text style={themeStyles.successToastText}>{successMessage}</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3e5f5' },
  bgCircleTop: {
    position: 'absolute', top: -100, left: -50,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#ffb6c1', opacity: 0.3,
  },
  bgCircleBottom: {
    position: 'absolute', bottom: -100, right: -50,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: '#90caf9', opacity: 0.3,
  },
  instructionText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 }, // <-- Chính là nó đây
  successToast: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 52,
    left: 18,
    right: 18,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1f805b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  successToastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 11,
  },
  successToastContent: { flex: 1 },
  successToastTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  successToastText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 40,
  },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#1e3c72', letterSpacing: 1 },
  sloganText: { fontSize: 13, color: '#636e72', marginTop: 5 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    borderWidth: 1, borderColor: '#fff'
  },
  backBtn: { position: 'absolute', top: 0, left: 0, zIndex: 10 }, // <-- Chính là nó
  formContainer: { width: '100%' },
  authTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 25 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f4f8',
    borderRadius: 14,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1, borderColor: '#e1e8f0',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  formActions: { alignItems: 'flex-end', marginBottom: 25, marginTop: -5 },
  linkText: { color: '#636e72', fontSize: 13, fontWeight: '600' },
  boldLinkText: { color: '#1976d2', fontSize: 14, fontWeight: '800' },
  btnSubmit: {
    backgroundColor: '#64b5f6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#64b5f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  btnSubmitText: { color: '#1e3c72', fontSize: 18, fontWeight: '800' },
  dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 10, color: '#888', fontSize: 12, fontWeight: '600' },
  socialLogins: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  socialBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  switchFormText: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  mutedText: { color: '#636e72', fontSize: 14 },
});