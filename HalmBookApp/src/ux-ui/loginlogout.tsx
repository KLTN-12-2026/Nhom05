import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AUTH_ENDPOINTS,
  AuthSession,
  loginWithFacebookOAuth,
  loginWithGoogleOAuth,
  postToAuthBackend,
  saveMobileAuthSession,
} from './authService';
import { useAppNavigation } from './navigation';

type ScreenState = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

interface AuthProps {
  onLoginSuccess: () => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const {
    isDarkMode,
    setIsLoggedIn,
    setUserAvatarUrl,
    setUserInitial,
  } = useAppNavigation();

  const [currentScreen, setCurrentScreen] = useState<ScreenState>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<'google' | 'facebook' | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==============================================================
  // HỆ MÀU DUAL-THEME (LIGHT MODE & DARK MODE)
  // ==============================================================
  const isDark = isDarkMode;
  const colors = {
    screenBg: isDark ? '#181716' : '#F7F5F0',
    cardBg: isDark ? '#242321' : '#FFFFFF',
    cardBorder: isDark ? '#383633' : '#E6E1D8',
    textPrimary: isDark ? '#F7F5F0' : '#242321',
    textSecondary: isDark ? '#A39F99' : '#85817A',
    accent: isDark ? '#E5A93C' : '#8B4A3C',
    accentText: isDark ? '#181716' : '#FFFFFF',
    inputBg: isDark ? '#1E1D1B' : '#F7F5F0',
    placeholder: isDark ? '#6E6A63' : '#9E9A92',
    divider: isDark ? '#383633' : '#E6E1D8',
    orbTop: isDark ? '#8B4A3C' : '#E6CFC8',
    orbBottom: isDark ? '#E5A93C' : '#E8D9B5',
  };

  useEffect(() => {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
    console.warn('EXPO_AUTH_REDIRECT_URI:', redirectUri);
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const showSuccess = (message: string, onComplete: () => void) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setSuccessMessage(message);
    transitionTimer.current = setTimeout(() => {
      setSuccessMessage('');
      transitionTimer.current = null;
      onComplete();
    }, 1200);
  };

  const syncUserToContext = (fullName?: string, avatarUrl?: string) => {
    setIsLoggedIn?.(true);
    if (avatarUrl) {
      setUserAvatarUrl?.(avatarUrl);
    }
    if (fullName && fullName.trim().length > 0) {
      setUserInitial?.(fullName.trim().charAt(0).toUpperCase());
    }
  };

  // ----------------------------------------------------
  // QUẢN LÝ DỮ LIỆU (STATE)
  // ----------------------------------------------------
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // ----------------------------------------------------
  // SERVICE 1: ĐĂNG NHẬP TÀI KHOẢN NỘI BỘ (POST /api/auth/login)
  // ----------------------------------------------------
  const handleLogin = async () => {
    const userVal = loginUsername.trim();
    const passVal = loginPassword.trim();

    if (!userVal || !passVal) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    if (isLoginSubmitting || socialSubmitting) return;
    setIsLoginSubmitting(true);

    try {
      const responseData = await postToAuthBackend(AUTH_ENDPOINTS.LOGIN, {
        username: userVal,
        password: passVal,
      });

      const session = await saveMobileAuthSession(responseData, userVal);
      syncUserToContext(session.user.fullName, session.user.avatar);

      showSuccess(
        'Đăng nhập thành công! Chào mừng bạn đến với HALM BOOK.',
        onLoginSuccess
      );
    } catch {
      Alert.alert('Đăng nhập thất bại', 'Đăng nhập thất bại, vui lòng thử lại');
      setIsLoginSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // SERVICE 1B: ĐĂNG NHẬP GOOGLE (POST /api/auth/google)
  // ----------------------------------------------------
  const handleGoogleLogin = async () => {
    if (isLoginSubmitting || socialSubmitting) return;
    setSocialSubmitting('google');

    try {
      const result = await loginWithGoogleOAuth();

      // Nếu người dùng đóng/hủy cửa sổ xác thực giữa chừng -> thoát êm, không báo lỗi
      if (result.cancelled || !result.session) {
        setSocialSubmitting(null);
        return;
      }

      syncUserToContext(
        result.session.user.fullName,
        result.session.user.avatar
      );
      setSocialSubmitting(null);
      showSuccess(
        `Đăng nhập Google thành công! Xin chào ${result.session.user.fullName}.`,
        onLoginSuccess
      );
    } catch {
      setSocialSubmitting(null);
      Alert.alert('Thông báo', 'Đăng nhập thất bại, vui lòng thử lại');
    }
  };

  // ----------------------------------------------------
  // SERVICE 1C: ĐĂNG NHẬP FACEBOOK (POST /api/auth/facebook)
  // ----------------------------------------------------
  const handleFacebookLogin = async () => {
    if (isLoginSubmitting || socialSubmitting) return;
    setSocialSubmitting('facebook');

    try {
      const result = await loginWithFacebookOAuth();

      // Nếu người dùng đóng/hủy cửa sổ xác thực giữa chừng -> thoát êm, không báo lỗi
      if (result.cancelled || !result.session) {
        setSocialSubmitting(null);
        return;
      }

      syncUserToContext(
        result.session.user.fullName,
        result.session.user.avatar
      );
      setSocialSubmitting(null);
      showSuccess(
        `Đăng nhập Facebook thành công! Xin chào ${result.session.user.fullName}.`,
        onLoginSuccess
      );
    } catch {
      setSocialSubmitting(null);
      Alert.alert('Thông báo', 'Đăng nhập thất bại, vui lòng thử lại');
    }
  };

  // ----------------------------------------------------
  // SERVICE 2: ĐĂNG KÝ (POST /api/auth/register)
  // ----------------------------------------------------
  const handleRegister = async () => {
    const userVal = regUsername.trim();
    const emailVal = regEmail.trim();

    if (!userVal || !emailVal || !regPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await postToAuthBackend(AUTH_ENDPOINTS.REGISTER, {
        username: userVal,
        email: emailVal,
        password: regPassword,
      });

      Alert.alert(
        'Thành công',
        'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
        [
          {
            text: 'OK',
            onPress: () => {
              setRegUsername('');
              setRegEmail('');
              setRegPassword('');
              setRegConfirmPassword('');
              setCurrentScreen('login');
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMsg =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Đăng ký thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMsg);
    }
  };

  // ----------------------------------------------------
  // SERVICE 3: QUÊN MẬT KHẨU (GỬI MÃ OTP)
  // ----------------------------------------------------
  const handleSendOTP = async () => {
    const emailVal = forgotEmail.trim();
    if (!emailVal) {
      Alert.alert('Lỗi', 'Vui lòng nhập Email của bạn.');
      return;
    }

    try {
      await postToAuthBackend('/api/password/send-otp', { email: emailVal });
      Alert.alert('Thành công', `Đã gửi mã OTP tới ${emailVal}`);
      setCurrentScreen('otp');
    } catch (error: any) {
      const errorMsg =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Lỗi gửi OTP. Không tìm thấy Email này.';
      Alert.alert('Lỗi', errorMsg);
    }
  };

  // ----------------------------------------------------
  // SERVICE 4: XÁC THỰC MÃ OTP
  // ----------------------------------------------------
  const handleVerifyOTP = async () => {
    if (otpCode.trim().length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }

    try {
      await postToAuthBackend('/api/password/verify-otp', {
        email: forgotEmail.trim(),
        otp: otpCode.trim(),
      });

      Alert.alert('Thành công', 'Mã OTP chính xác!');
      setCurrentScreen('reset');
    } catch (error: any) {
      const errorMsg =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Mã OTP không đúng hoặc đã hết hạn.';
      Alert.alert('Lỗi', errorMsg);
    }
  };

  // ----------------------------------------------------
  // SERVICE 5: ĐẶT LẠI MẬT KHẨU MỚI
  // ----------------------------------------------------
  const handleResetPassword = async () => {
    if (resetPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu cần có ít nhất 6 ký tự.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await postToAuthBackend('/api/password/reset-password', {
        email: forgotEmail.trim(),
        newPassword: resetPassword,
      });

      Alert.alert(
        'Thành công',
        'Đổi mật khẩu thành công! Hãy đăng nhập lại.',
        [
          {
            text: 'OK',
            onPress: () => {
              setForgotEmail('');
              setOtpCode('');
              setResetPassword('');
              setResetConfirmPassword('');
              setCurrentScreen('login');
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMsg =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Đổi mật khẩu thất bại.';
      Alert.alert('Lỗi', errorMsg);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.logoText, { color: colors.textPrimary }]}>
        HALM <Text style={{ color: colors.accent }}>BOOK</Text>
      </Text>
      <Text style={[styles.sloganText, { color: colors.textSecondary }]}>
        Khám phá thế giới qua từng trang sách
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        {...({ translucent: true, backgroundColor: 'transparent' } as any)}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Background Trang trí Dual-Theme */}
      <View
        style={[
          styles.bgCircleTop,
          { backgroundColor: colors.orbTop, opacity: isDark ? 0.14 : 0.25 },
        ]}
      />
      <View
        style={[
          styles.bgCircleBottom,
          { backgroundColor: colors.orbBottom, opacity: isDark ? 0.12 : 0.25 },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* ===================== MÀN HÌNH ĐĂNG NHẬP ===================== */}
          {currentScreen === 'login' && (
            <View style={styles.formContainer}>
              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                Đăng nhập
              </Text>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Tên đăng nhập"
                  placeholderTextColor={colors.placeholder}
                  value={loginUsername}
                  onChangeText={setLoginUsername}
                  autoCapitalize="none"
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Mật khẩu"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity onPress={() => setCurrentScreen('forgot')}>
                  <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                    Quên mật khẩu?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: colors.accent }]}
                onPress={handleLogin}
                disabled={isLoginSubmitting || socialSubmitting !== null}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnSubmitText, { color: colors.accentText }]}>
                  {isLoginSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerBox}>
                <View
                  style={[styles.dividerLine, { backgroundColor: colors.divider }]}
                />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                  Hoặc đăng nhập bằng
                </Text>
                <View
                  style={[styles.dividerLine, { backgroundColor: colors.divider }]}
                />
              </View>

              {/* SOCIAL LOGIN: CHỈ GOOGLE & FACEBOOK NẰM NGANG (50% - 50%, ĐÃ LƯỢC BỎ APPLE) */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[
                    styles.socialBtn,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={handleGoogleLogin}
                  disabled={isLoginSubmitting || socialSubmitting !== null}
                  activeOpacity={0.8}
                >
                  {socialSubmitting === 'google' ? (
                    <ActivityIndicator size="small" color="#DB4437" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#DB4437" />
                      <Text
                        style={[
                          styles.socialBtnLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.socialBtn,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={handleFacebookLogin}
                  disabled={isLoginSubmitting || socialSubmitting !== null}
                  activeOpacity={0.8}
                >
                  {socialSubmitting === 'facebook' ? (
                    <ActivityIndicator size="small" color="#1877F2" />
                  ) : (
                    <>
                      <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                      <Text
                        style={[
                          styles.socialBtnLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Facebook
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.switchFormText}>
                <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
                  Chưa có tài khoản?{' '}
                </Text>
                <TouchableOpacity onPress={() => setCurrentScreen('register')}>
                  <Text style={[styles.boldLinkText, { color: colors.accent }]}>
                    Đăng ký ngay
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===================== MÀN HÌNH ĐĂNG KÝ ===================== */}
          {currentScreen === 'register' && (
            <View style={styles.formContainer}>
              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                Đăng ký
              </Text>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Tên đăng nhập"
                  placeholderTextColor={colors.placeholder}
                  value={regUsername}
                  onChangeText={setRegUsername}
                  autoCapitalize="none"
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Email"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Mật khẩu"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.btnSubmit,
                  { backgroundColor: colors.accent, marginTop: 10 },
                ]}
                onPress={handleRegister}
              >
                <Text style={[styles.btnSubmitText, { color: colors.accentText }]}>
                  Đăng ký tài khoản
                </Text>
              </TouchableOpacity>

              <View style={[styles.switchFormText, { marginTop: 20 }]}>
                <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
                  Đã có tài khoản?{' '}
                </Text>
                <TouchableOpacity onPress={() => setCurrentScreen('login')}>
                  <Text style={[styles.boldLinkText, { color: colors.accent }]}>
                    Đăng nhập
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===================== BƯỚC 1: QUÊN MẬT KHẨU ===================== */}
          {currentScreen === 'forgot' && (
            <View style={styles.formContainer}>
              <TouchableOpacity
                onPress={() => setCurrentScreen('login')}
                style={styles.backBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                Quên mật khẩu
              </Text>
              <Text
                style={[styles.instructionText, { color: colors.textSecondary }]}
              >
                Vui lòng nhập Email để nhận mã xác thực (OTP).
              </Text>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Nhập Email của bạn"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: colors.accent }]}
                onPress={handleSendOTP}
              >
                <Text style={[styles.btnSubmitText, { color: colors.accentText }]}>
                  Gửi mã OTP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===================== BƯỚC 2: NHẬP MÃ OTP ===================== */}
          {currentScreen === 'otp' && (
            <View style={styles.formContainer}>
              <TouchableOpacity
                onPress={() => setCurrentScreen('forgot')}
                style={styles.backBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                Nhập mã OTP
              </Text>
              <Text
                style={[styles.instructionText, { color: colors.textSecondary }]}
              >
                Mã 6 chữ số đã được gửi đến {forgotEmail}
              </Text>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      fontSize: 22,
                      fontWeight: 'bold',
                      letterSpacing: 15,
                      textAlign: 'center',
                    },
                  ]}
                  placeholder="••••••"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: colors.accent }]}
                onPress={handleVerifyOTP}
              >
                <Text style={[styles.btnSubmitText, { color: colors.accentText }]}>
                  Xác nhận
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={handleSendOTP}
              >
                <Text style={[styles.linkText, { color: colors.accent }]}>
                  Gửi lại mã
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===================== BƯỚC 3: ĐẶT LẠI MẬT KHẨU ===================== */}
          {currentScreen === 'reset' && (
            <View style={styles.formContainer}>
              <TouchableOpacity
                onPress={() => setCurrentScreen('login')}
                style={styles.backBtn}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
                Tạo mật khẩu mới
              </Text>
              <Text
                style={[styles.instructionText, { color: colors.textSecondary }]}
              >
                Vui lòng tạo mật khẩu mới cho tài khoản của bạn.
              </Text>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Mật khẩu mới"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                  value={resetPassword}
                  onChangeText={setResetPassword}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Xác nhận mật khẩu mới"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                  value={resetConfirmPassword}
                  onChangeText={setResetConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: colors.accent }]}
                onPress={handleResetPassword}
              >
                <Text style={[styles.btnSubmitText, { color: colors.accentText }]}>
                  Cập nhật mật khẩu
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {!!successMessage && (
        <View style={styles.successToast} accessibilityRole="alert">
          <View style={styles.successToastIcon}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
          <View style={styles.successToastContent}>
            <Text style={styles.successToastTitle}>Thành công</Text>
            <Text style={styles.successToastText}>{successMessage}</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgCircleTop: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
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
  successToastContent: {
    flex: 1,
  },
  successToastTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  successToastText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sloganText: {
    fontSize: 13,
    marginTop: 5,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  formContainer: {
    width: '100%',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 22,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  formActions: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  boldLinkText: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnSubmit: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },

  // Khu vực Social Login mới (2 nút Google & Facebook nằm ngang 50%-50%)
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
  },

  switchFormText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  mutedText: {
    fontSize: 14,
  },
});
