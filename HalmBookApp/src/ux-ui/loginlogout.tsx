import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';

// ----------------------------------------------------
// CẤU HÌNH KẾT NỐI (ĐIỂM MÙ LOCALHOST)
// ----------------------------------------------------
// KHÔNG ĐƯỢC dùng 'localhost'. Phải dùng IPv4 của máy tính chạy Spring Boot.
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const API_BASE_URL = `http://${localhost}:8082`;
// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
// ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8082' : 'http://localhost:8082');

const axiosAppInstance = axios.create({
  baseURL: API_BASE_URL,
  // Bỏ withCredentials: true đi vì Mobile không dùng Cookie
});

type ScreenState = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

interface AuthProps {
  onLoginSuccess: () => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const themeStyles = useAppThemeStyles(styles);
  const { isDarkMode } = useAppNavigation();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
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
      <Text style={themeStyles.sloganText}>Khám phá thế giới qua từng trang sách</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={themeStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Background Trang trí */}
      <View style={themeStyles.bgCircleTop} />
      <View style={themeStyles.bgCircleBottom} />

      <ScrollView contentContainerStyle={themeStyles.scrollContent} showsVerticalScrollIndicator={false}>

        {renderHeader()}

        <View style={themeStyles.card}>

          {/* ===================== MÀN HÌNH ĐĂNG NHẬP ===================== */}
          {currentScreen === 'login' && (
            <View style={themeStyles.formContainer}>
              <Text style={themeStyles.authTitle}>Đăng nhập</Text>

              <View style={themeStyles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                <TextInput
                  style={themeStyles.input}
                  placeholder="Tên đăng nhập"
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
                  placeholder="Mật khẩu"
                  placeholderTextColor="#a4b0be"
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
              </View>

              <View style={themeStyles.formActions}>
                <TouchableOpacity onPress={() => setCurrentScreen('forgot')}>
                  <Text style={themeStyles.linkText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {/* BẮN SỰ KIỆN: Gắn hàm handleLogin vào nút bấm */}
              <TouchableOpacity style={themeStyles.btnSubmit} onPress={handleLogin} disabled={isLoginSubmitting}>
                <Text style={themeStyles.btnSubmitText}>{isLoginSubmitting ? 'Đang đăng nhập...' : 'Here We Go'}</Text>
              </TouchableOpacity>

              <View style={themeStyles.dividerBox}>
                <View style={themeStyles.dividerLine} />
                <Text style={themeStyles.dividerText}>Hoặc đăng nhập bằng</Text>
                <View style={themeStyles.dividerLine} />
              </View>

              <View style={themeStyles.socialLogins}>
                <TouchableOpacity style={themeStyles.socialBtn}><Ionicons name="logo-google" size={22} color="#DB4437" /></TouchableOpacity>
                <TouchableOpacity style={themeStyles.socialBtn}><Ionicons name="logo-facebook" size={22} color="#1877F2" /></TouchableOpacity>
                <TouchableOpacity style={themeStyles.socialBtn}><Ionicons name="logo-apple" size={22} color="#000" /></TouchableOpacity>
              </View>

              <View style={themeStyles.switchFormText}>
                <Text style={themeStyles.mutedText}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => setCurrentScreen('register')}>
                  <Text style={themeStyles.boldLinkText}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===================== MÀN HÌNH ĐĂNG KÝ ===================== */}
          {currentScreen === 'register' && (
            <View style={themeStyles.formContainer}>
              <Text style={themeStyles.authTitle}>Đăng ký</Text>

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
                <Text style={themeStyles.mutedText}>Đã có tài khoản? </Text>
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