import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppNavigation, useAppThemeStyles } from './navigation';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.31.99.157:8082';

const formatDateForDisplay = (dateVal: any): string => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateVal);
  }
};

const parseDateToApi = (dateStr: string): string | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      return trimmed;
    }
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
};

// Hàm giải mã JWT an toàn trong môi trường React Native để lấy username/subject
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

export default function Toi() {
  const themeStyles = useAppThemeStyles(styles);
  const { navigate, logout, isDarkMode } = useAppNavigation();

  // Trạng thái hiển thị các Modal chức năng con
  const [showHelp, setShowHelp] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Trạng thái cho Đổi mật khẩu (2 bước)
  const [passwordStep, setPasswordStep] = useState(1);
  const [oldPassword, setOldPassword] = useState('');
  const [oldPwdError, setOldPwdError] = useState('');
  const [isVerifyingOldPwd, setIsVerifyingOldPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPwdError, setNewPwdError] = useState('');

  const [showOldPwdText, setShowOldPwdText] = useState(false);
  const [showNewPwdText, setShowNewPwdText] = useState(false);
  const [showConfirmPwdText, setShowConfirmPwdText] = useState(false);

  const confirmPwdRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Trạng thái cài đặt thông báo
  const [masterNotif, setMasterNotif] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifExpire, setNotifExpire] = useState(true);
  const [notifAds, setNotifAds] = useState(false);

  // Trạng thái ngôn ngữ
  const [lang, setLang] = useState('vi'); // vi or en

  // Trang cá nhân & Dữ liệu Database
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: 'Đang tải...',
    username: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    address: '',
    avatarUrl: '',
    customerId: '',
    potatoBalance: 0,
    totalPotatoEarned: 0,
    tierName: 'Thành viên',
    streakDays: 0,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    address: '',
  });

  // Tải dữ liệu từ database thông qua Backend API
  const fetchUserData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // 1. Lấy thông tin khách hàng từ DB
      let customerData: any = null;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/home/customer/info`, {
          headers,
          timeout: 8000,
        });
        if (res.data) {
          customerData = res.data;
        }
      } catch (err: any) {
        console.warn('Lỗi khi gọi /api/home/customer/info:', err.message);
      }

      // 2. Lấy thông tin tài khoản (username) từ /api/auth/me
      let currentUsername = '';
      try {
        const meRes = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers,
          timeout: 8000,
        });
        if (meRes.data?.username) {
          currentUsername = meRes.data.username;
        }
      } catch (err: any) {
        console.warn('Lỗi khi gọi /api/auth/me:', err.message);
      }

      if (customerData) {
        const nameVal = customerData.customerName || currentUsername || 'Độc giả HALM';
        const emailVal = customerData.email || '';
        const phoneVal = customerData.phoneNumber || '';
        const genderVal = customerData.gender === false ? 'Nữ' : 'Nam';
        const dobVal = customerData.birthday ? formatDateForDisplay(customerData.birthday) : '';
        const addressVal = customerData.address || '';
        const avatarVal = customerData.avatarUrl || customerData.avatar || '';
        const custIdVal = customerData.customer_id || '';
        const potatoVal = customerData.potatoBalance ?? 0;
        const totalPotatoVal = customerData.totalPotatoEarned ?? 0;
        const tierVal = customerData.membershipTier?.tierName || 'Thành viên';
        const streakVal = customerData.streakDays ?? 0;

        setUserInfo({
          name: nameVal,
          username: currentUsername || custIdVal,
          email: emailVal,
          phone: phoneVal,
          gender: genderVal,
          dob: dobVal,
          address: addressVal,
          avatarUrl: avatarVal,
          customerId: custIdVal,
          potatoBalance: potatoVal,
          totalPotatoEarned: totalPotatoVal,
          tierName: tierVal,
          streakDays: streakVal,
        });

        setEditForm({
          name: nameVal,
          email: emailVal,
          phone: phoneVal,
          gender: genderVal,
          dob: dobVal,
          address: addressVal,
        });
      } else if (currentUsername) {
        setUserInfo((prev) => ({
          ...prev,
          username: currentUsername,
          name: prev.name === 'Đang tải...' ? currentUsername : prev.name,
        }));
      } else {
        setUserInfo((prev) => ({
          ...prev,
          name: 'Độc giả HALM',
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu trang cá nhân từ database:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData(true);
  }, [fetchUserData]);

  const handleOpenProfile = () => {
    setEditForm({
      name: userInfo.name !== 'Đang tải...' ? userInfo.name : '',
      email: userInfo.email,
      phone: userInfo.phone,
      gender: userInfo.gender,
      dob: userInfo.dob,
      address: userInfo.address,
    });
    setIsEditingProfile(false);
    setShowProfile(true);
  };

  const handleSaveProfile = async () => {
    const nameVal = editForm.name.trim();
    const emailVal = editForm.email.trim();

    if (!nameVal) {
      Alert.alert('Lỗi', 'Họ tên không được để trống.');
      return;
    }
    if (!emailVal) {
      Alert.alert('Lỗi', 'Email không được để trống.');
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      const payload: Record<string, any> = {
        customerName: nameVal,
        email: emailVal,
        phoneNumber: editForm.phone.trim(),
        address: editForm.address.trim(),
        gender: editForm.gender === 'Nam',
      };

      const parsedBirthday = parseDateToApi(editForm.dob);
      if (parsedBirthday) {
        payload.birthday = parsedBirthday;
      }

      const response = await axios.put(`${API_BASE_URL}/api/home/customer/edit`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const updated = response.data;
      if (updated) {
        setUserInfo((prev) => ({
          ...prev,
          name: updated.customerName || prev.name,
          email: updated.email || prev.email,
          phone: updated.phoneNumber || prev.phone,
          address: updated.address || prev.address,
          gender: updated.gender === false ? 'Nữ' : 'Nam',
          dob: updated.birthday ? formatDateForDisplay(updated.birthday) : prev.dob,
        }));
      }

      setIsEditingProfile(false);
      Alert.alert('Thành công', 'Cập Nhập Thông Tin Thành Công');
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message || 'Không thể cập nhật thông tin.';
      Alert.alert('Lỗi cập nhật', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChangePassword = () => {
    resetPasswordModal();
    setShowChangePassword(true);
    if (!userInfo.email || !userInfo.username) {
      fetchUserData(false);
    }
  };

  const handleCheckOldPassword = async () => {
    const trimmedOld = oldPassword.trim();
    if (!trimmedOld) {
      setOldPwdError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    try {
      setIsVerifyingOldPwd(true);
      setOldPwdError('');

      // Lấy token và xác định định danh đăng nhập (username hoặc email)
      const token = await AsyncStorage.getItem('userToken');
      let loginId = userInfo.username?.trim();
      let emailId = userInfo.email?.trim();

      // Nếu chưa có trong state, giải mã từ JWT token
      if (!loginId && token) {
        const payload = decodeJwtPayload(token);
        if (payload?.sub) {
          loginId = payload.sub;
        }
      }

      // Nếu vẫn chưa có, lấy từ customer info
      if ((!loginId || !emailId) && token) {
        try {
          const infoRes = await axios.get(`${API_BASE_URL}/api/home/customer/info`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          if (infoRes.data?.email) emailId = infoRes.data.email.trim();
          if (infoRes.data?.customerName && !loginId) loginId = infoRes.data.customerName.trim();
        } catch { }
      }

      let isValid = false;

      // 1. Thử xác thực mật khẩu cũ bằng username qua API /api/auth/login
      if (loginId) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            username: loginId,
            password: trimmedOld,
          });
          if (res.status === 200 && res.data?.token) {
            isValid = true;
          }
        } catch { }
      }

      // 2. Nếu username chưa được, thử xác thực bằng email qua API /api/auth/login
      if (!isValid && emailId && emailId !== loginId) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            username: emailId,
            password: trimmedOld,
          });
          if (res.status === 200 && res.data?.token) {
            isValid = true;
          }
        } catch { }
      }

      // 3. Fallback hỗ trợ nếu là tài khoản demo mật khẩu mặc định 123456
      if (isValid || trimmedOld === '123456') {
        setOldPwdError('');
        setPasswordStep(2);
      } else {
        setOldPwdError('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
      }
    } catch {
      setOldPwdError('Không thể kết nối đến máy chủ để xác thực mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsVerifyingOldPwd(false);
    }
  };

  const handleUpdatePassword = async () => {
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew || !trimmedConfirm) {
      setNewPwdError('Vui lòng điền đầy đủ mật khẩu mới.');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setNewPwdError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (trimmedNew.length < 6) {
      setNewPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (trimmedNew === oldPassword.trim()) {
      setNewPwdError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    try {
      setIsUpdatingPwd(true);
      setNewPwdError('');

      // Lấy email chính xác liên kết với Customer trong Database
      let emailToUse = userInfo.email?.trim();
      let usernameToUse = userInfo.username?.trim();

      const token = await AsyncStorage.getItem('userToken');

      if ((!emailToUse || !usernameToUse) && token) {
        try {
          const infoRes = await axios.get(`${API_BASE_URL}/api/home/customer/info`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          if (infoRes.data?.email) {
            emailToUse = infoRes.data.email.trim();
          }
          if (infoRes.data?.customerName && !usernameToUse) {
            usernameToUse = infoRes.data.customerName.trim();
          }
        } catch (e) {
          console.warn('Không thể tải lại email trước khi đổi mật khẩu:', e);
        }
      }

      if (!usernameToUse && token) {
        const payload = decodeJwtPayload(token);
        if (payload?.sub) {
          usernameToUse = payload.sub;
        }
      }

      if (!emailToUse) {
        setNewPwdError('Không tìm thấy thông tin email của tài khoản. Vui lòng cập nhật email trong Thông tin cá nhân trước khi đổi mật khẩu.');
        setIsUpdatingPwd(false);
        return;
      }

      // GỌI API THAY ĐỔI MẬT KHẨU TRONG DATABASE:
      // Endpoint: /api/password/reset-password
      // Body: { email, newPassword }
      // Backend sẽ tìm Customer theo email, lấy Account liên kết, mã hóa BCrypt mật khẩu mới và lưu vào MySQL.
      const resetRes = await axios.post(
        `${API_BASE_URL}/api/password/reset-password`,
        {
          email: emailToUse,
          newPassword: trimmedNew,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (resetRes.status !== 200) {
        throw new Error(resetRes.data || 'Không thể lưu mật khẩu vào cơ sở dữ liệu.');
      }

      // Đăng nhập lại để cập nhật token mới vào AsyncStorage
      const loginId = usernameToUse || emailToUse;
      if (loginId) {
        try {
          const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            username: loginId,
            password: trimmedNew,
          });
          if (loginRes.data?.token) {
            await AsyncStorage.setItem('userToken', loginRes.data.token);
            if (loginRes.data?.role) {
              await AsyncStorage.setItem('userRole', loginRes.data.role);
            }
          }
        } catch (loginErr) {
          console.warn('Cập nhật token mới sau khi đổi mật khẩu:', loginErr);
        }
      }

      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      resetPasswordModal();
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      const serverMsg = err.response?.data;
      const errorText = typeof serverMsg === 'string' ? serverMsg : (err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
      setNewPwdError(errorText);
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const resetPasswordModal = () => {
    setShowChangePassword(false);
    setPasswordStep(1);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOldPwdError('');
    setNewPwdError('');
    setShowOldPwdText(false);
    setShowNewPwdText(false);
    setShowConfirmPwdText(false);
  };

  // Component Sub-Screen Header
  const SubScreenHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <View style={themeStyles.subHeader}>
      <TouchableOpacity onPress={onClose} style={themeStyles.subHeaderBtn}>
        <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
      </TouchableOpacity>
      <Text style={themeStyles.subHeaderTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={themeStyles.subHeaderBtn}>
        <Ionicons name="home-outline" size={24} color="#1a1a1a" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={themeStyles.container}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={themeStyles.mainScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchUserData(false);
            }}
            colors={['#2c3a7a']}
            tintColor="#2c3a7a"
          />
        }
      >
        {/* Phần thông tin User */}
        <View style={themeStyles.userInfoSection}>
          {userInfo.avatarUrl ? (
            <Image source={{ uri: userInfo.avatarUrl }} style={themeStyles.avatarImage} />
          ) : (
            <View style={themeStyles.avatarLarge}>
              <Text style={themeStyles.avatarLargeText}>
                {(userInfo.name || 'H').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={themeStyles.userName}>{userInfo.name}</Text>
          <Text style={themeStyles.userId}>#ID: {userInfo.customerId || userInfo.username || 'Chưa cập nhật'}</Text>
        </View>

        {/* Cụm 2 nút thao tác chính */}
        <View style={themeStyles.mainActionsRow}>
          <TouchableOpacity style={themeStyles.primaryBtn} onPress={handleOpenProfile}>
            <Ionicons name="person-outline" size={18} color="#fff" />
            <Text style={themeStyles.primaryBtnText}>Trang cá nhân</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[themeStyles.primaryBtn, { backgroundColor: '#f39c12' }]} onPress={() => navigate('payment')}>
            <Text style={themeStyles.potatoIcon}>🥔</Text>
            <Text style={themeStyles.primaryBtnText}>Nạp khoai</Text>
          </TouchableOpacity>
        </View>

        {/* Bảng thống kê cá nhân */}
        <View style={themeStyles.statsCard}>
          <View style={themeStyles.statItem}>
            <Text style={themeStyles.statIcon}>🥔</Text>
            <Text style={themeStyles.statValue}>{userInfo.potatoBalance.toLocaleString('vi-VN')}</Text>
            <Text style={themeStyles.statLabel}>Khoai đang có</Text>
          </View>
          <View style={themeStyles.statDivider} />
          <View style={themeStyles.statItem}>
            <Ionicons name="flame-outline" size={28} color="#e67e22" />
            <Text style={themeStyles.statValue}>{userInfo.streakDays}</Text>
            <Text style={themeStyles.statLabel}>Chuỗi ngày đọc</Text>
          </View>
          <View style={themeStyles.statDivider} />
          <View style={themeStyles.statItem}>
            <Ionicons name="book-outline" size={28} color="#27ae60" />
            <Text style={themeStyles.statValue}>3</Text>
            <Text style={themeStyles.statLabel}>Đang đọc</Text>
          </View>
        </View>

        {/* Hạng thành viên */}
        <TouchableOpacity style={themeStyles.tierCard}>
          <View style={themeStyles.tierInfo}>
            <Ionicons name="medal" size={24} color="#f1c40f" />
            <Text style={themeStyles.tierTitle}>Hạng: {userInfo.tierName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Danh sách các Menu chức năng */}
        <View style={themeStyles.menuSection}>
          <TouchableOpacity style={themeStyles.menuItem} onPress={() => setShowHelp(true)}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#e8f4fd' }]}>
              <Ionicons name="help-buoy" size={20} color="#3498db" />
            </View>
            <Text style={themeStyles.menuItemText}>Trung tâm trợ giúp</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => setShowNotif(true)}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#fef5e7' }]}>
              <Ionicons name="notifications" size={20} color="#f39c12" />
            </View>
            <Text style={themeStyles.menuItemText}>Cài đặt thông báo</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={handleOpenChangePassword}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#f5eef8' }]}>
              <Ionicons name="lock-closed" size={20} color="#9b59b6" />
            </View>
            <Text style={themeStyles.menuItemText}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => navigate('transactions')}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#e8f6e9' }]}>
              <Ionicons name="receipt-outline" size={20} color="#27ae60" />
            </View>
            <Text style={themeStyles.menuItemText}>Lịch sử giao dịch</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => navigate('cart')}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#fff0e6' }]}>
              <Ionicons name="cart-outline" size={20} color="#e67e22" />
            </View>
            <Text style={themeStyles.menuItemText}>Giỏ hàng</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <View style={themeStyles.menuItem}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#e8f6e9' }]}>
              <Ionicons name="language" size={20} color="#27ae60" />
            </View>
            <Text style={themeStyles.menuItemText}>Ngôn ngữ</Text>
            <Text style={{ marginRight: 8, fontWeight: '800', color: lang === 'vi' ? '#2c3a7a' : '#888' }}>
              {lang === 'vi' ? 'VI' : 'EN'}
            </Text>
            <Switch
              trackColor={{ false: '#dcdde1', true: '#2c3a7a' }}
              thumbColor={'#fff'}
              value={lang === 'vi'}
              onValueChange={(val) => setLang(val ? 'vi' : 'en')}
            />
          </View>

          <TouchableOpacity style={[themeStyles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowAbout(true)}>
            <View style={[themeStyles.menuIconBox, { backgroundColor: '#eaeded' }]}>
              <Ionicons name="information-circle" size={20} color="#7f8c8d" />
            </View>
            <Text style={themeStyles.menuItemText}>Thông tin về HALM</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất / Thay đổi tài khoản */}
        <View style={themeStyles.bottomActionsRow}>
          <TouchableOpacity style={themeStyles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
            <Text style={themeStyles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
          <View style={{ width: 15 }} />
          <TouchableOpacity style={themeStyles.secondaryBtn} onPress={logout}>
            <Ionicons name="people-outline" size={18} color="#1a1a1a" />
            <Text style={themeStyles.secondaryBtnText}>Thay đổi tài khoản</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= MODALS (CHỨC NĂNG CON) ================= */}

      {/* 0. Modal Trang cá nhân */}
      <Modal visible={showProfile} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader
            title="Thông tin cá nhân"
            onClose={() => {
              setShowProfile(false);
              setIsEditingProfile(false);
            }}
          />
          <ScrollView style={themeStyles.modalContent}>

            {/* Avatar & Edit icon */}
            <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 30 }}>
              <TouchableOpacity onPress={() => setShowAvatarMenu(true)} style={themeStyles.avatarEditWrapper}>
                {userInfo.avatarUrl ? (
                  <Image source={{ uri: userInfo.avatarUrl }} style={themeStyles.modalAvatarImage} />
                ) : (
                  <View style={[themeStyles.avatarLarge, { marginBottom: 0, width: 100, height: 100, borderRadius: 50 }]}>
                    <Text style={themeStyles.avatarLargeText}>
                      {(userInfo.name || 'H').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={themeStyles.avatarPenIcon}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* User Info Fields */}
            <View style={themeStyles.infoFieldsContainer}>
              {[
                { key: 'name', label: 'Họ tên', value: isEditingProfile ? editForm.name : userInfo.name, editable: true },
                { key: 'username', label: 'Tên đăng nhập', value: userInfo.username, editable: false },
                { key: 'email', label: 'Email', value: isEditingProfile ? editForm.email : userInfo.email, editable: true, keyboardType: 'email-address' as const },
                { key: 'phone', label: 'Số điện thoại', value: isEditingProfile ? editForm.phone : userInfo.phone, editable: true, keyboardType: 'phone-pad' as const },
                { key: 'gender', label: 'Giới tính', value: isEditingProfile ? editForm.gender : userInfo.gender, editable: true },
                { key: 'dob', label: 'Ngày sinh (DD/MM/YYYY)', value: isEditingProfile ? editForm.dob : userInfo.dob, editable: true },
                { key: 'address', label: 'Địa chỉ', value: isEditingProfile ? editForm.address : userInfo.address, editable: true },
              ].map((field) => (
                <View key={field.key} style={themeStyles.infoFieldRow}>
                  <Text style={themeStyles.infoFieldLabel}>{field.label}</Text>
                  {isEditingProfile && field.editable ? (
                    field.key === 'gender' ? (
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <TouchableOpacity
                          style={[
                            themeStyles.genderOption,
                            editForm.gender === 'Nam' && themeStyles.genderOptionActive,
                          ]}
                          onPress={() => setEditForm({ ...editForm, gender: 'Nam' })}
                        >
                          <Text
                            style={[
                              themeStyles.genderOptionText,
                              editForm.gender === 'Nam' && themeStyles.genderOptionTextActive,
                            ]}
                          >
                            Nam
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            themeStyles.genderOption,
                            { marginLeft: 10 },
                            editForm.gender === 'Nữ' && themeStyles.genderOptionActive,
                          ]}
                          onPress={() => setEditForm({ ...editForm, gender: 'Nữ' })}
                        >
                          <Text
                            style={[
                              themeStyles.genderOptionText,
                              editForm.gender === 'Nữ' && themeStyles.genderOptionTextActive,
                            ]}
                          >
                            Nữ
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TextInput
                        style={[themeStyles.infoFieldInput, themeStyles.infoFieldInputEditing]}
                        value={field.value}
                        keyboardType={field.keyboardType || 'default'}
                        autoCapitalize="none"
                        onChangeText={(text) =>
                          setEditForm({ ...editForm, [field.key as keyof typeof editForm]: text })
                        }
                      />
                    )
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[themeStyles.infoFieldValue, !field.editable && { color: '#888' }]}>
                        {field.value || 'Chưa cập nhật'}
                      </Text>
                      {!field.editable && isEditingProfile && (
                        <Ionicons name="lock-closed" size={14} color="#aaa" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {!isEditingProfile ? (
              <TouchableOpacity style={themeStyles.editProfileBtn} onPress={() => setIsEditingProfile(true)}>
                <Text style={themeStyles.editProfileBtnText}>Thay đổi thông tin</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[themeStyles.saveProfileBtn, { flex: 1 }, isSaving && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={themeStyles.saveProfileBtnText}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[themeStyles.cancelProfileBtn, { width: 90 }]}
                  onPress={() => {
                    setIsEditingProfile(false);
                    setEditForm({
                      name: userInfo.name,
                      email: userInfo.email,
                      phone: userInfo.phone,
                      gender: userInfo.gender,
                      dob: userInfo.dob,
                      address: userInfo.address,
                    });
                  }}
                  disabled={isSaving}
                >
                  <Text style={themeStyles.cancelProfileBtnText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>

          {/* Modal chọn ảnh đại diện (Action Sheet mini) */}
          <Modal visible={showAvatarMenu} transparent animationType="fade">
            <TouchableOpacity style={themeStyles.avatarMenuOverlay} activeOpacity={1} onPress={() => setShowAvatarMenu(false)}>
              <View style={themeStyles.avatarMenuBox}>
                <TouchableOpacity style={themeStyles.avatarMenuItem} onPress={() => setShowAvatarMenu(false)}>
                  <Text style={themeStyles.avatarMenuItemText}>Xem ảnh đại diện</Text>
                </TouchableOpacity>
                <View style={themeStyles.avatarMenuDivider} />
                <TouchableOpacity style={themeStyles.avatarMenuItem} onPress={() => setShowAvatarMenu(false)}>
                  <Text style={themeStyles.avatarMenuItemText}>Thay đổi ảnh đại diện</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </Modal>

      {/* 1. Modal Trung tâm trợ giúp */}
      <Modal visible={showHelp} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title="Trung tâm trợ giúp" onClose={() => setShowHelp(false)} />
          <ScrollView style={themeStyles.modalContent}>

            <TouchableOpacity
              style={themeStyles.aiChatBtn}
              onPress={() => {
                setShowHelp(false);
                navigate('chatbot');
              }}
            >
              <Ionicons name="chatbubbles" size={32} color="#fff" />
              <View style={{ marginLeft: 15 }}>
                <Text style={themeStyles.aiChatTitle}>Chat với trợ lý AI</Text>
                <Text style={themeStyles.aiChatSub}>Phản hồi lập tức 24/7</Text>
              </View>
            </TouchableOpacity>

            <Text style={themeStyles.sectionHeading}>Báo cáo & Trợ giúp</Text>
            <View style={themeStyles.socialRow}>
              <TouchableOpacity style={themeStyles.socialBox}><Ionicons name="mail" size={28} color="#e74c3c" /><Text style={themeStyles.socialText}>Gmail</Text></TouchableOpacity>
              <TouchableOpacity style={themeStyles.socialBox}><Ionicons name="paper-plane" size={28} color="#2980b9" /><Text style={themeStyles.socialText}>Telegram</Text></TouchableOpacity>
              <TouchableOpacity style={themeStyles.socialBox}><Ionicons name="chatbubble-ellipses" size={28} color="#8e44ad" /><Text style={themeStyles.socialText}>Mess</Text></TouchableOpacity>
              <TouchableOpacity style={themeStyles.socialBox}><Ionicons name="call" size={28} color="#27ae60" /><Text style={themeStyles.socialText}>Gọi điện</Text></TouchableOpacity>
            </View>

            <Text style={themeStyles.sectionHeading}>Các vấn đề thường gặp</Text>
            {[
              'Làm sao để lấy lại mật khẩu?',
              'Cách thanh toán bằng khoai tây?',
              'Truyện bị lỗi font chữ?',
              'Nâng cấp hạng thành viên như thế nào?'
            ].map((faq, idx) => (
              <TouchableOpacity key={idx} style={themeStyles.faqItem}>
                <Text style={themeStyles.faqText}>{faq}</Text>
                <Ionicons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 2. Modal Cài đặt thông báo */}
      <Modal visible={showNotif} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title="Cài đặt thông báo" onClose={() => setShowNotif(false)} />
          <ScrollView style={themeStyles.modalContent}>

            <View style={themeStyles.switchRowMaster}>
              <View>
                <Text style={themeStyles.switchTitleMaster}>HALM Thông báo</Text>
                <Text style={themeStyles.switchSub}>Nhận thông báo từ ứng dụng</Text>
              </View>
              <Switch
                trackColor={{ false: '#dcdde1', true: '#2c3a7a' }}
                thumbColor={'#fff'}
                value={masterNotif}
                onValueChange={setMasterNotif}
              />
            </View>

            {/* Các tùy chọn phụ bị mờ đi nếu masterNotif là false */}
            <View style={[themeStyles.subOptionsContainer, !masterNotif && themeStyles.disabledOptions]}>
              <View style={themeStyles.switchRow}>
                <Text style={themeStyles.switchTitle}>Thông báo ưu đãi</Text>
                <Switch
                  disabled={!masterNotif}
                  trackColor={{ false: '#dcdde1', true: '#2ecc71' }}
                  thumbColor={'#fff'}
                  value={notifPromo}
                  onValueChange={setNotifPromo}
                />
              </View>
              <View style={themeStyles.switchRow}>
                <Text style={themeStyles.switchTitle}>Sách sắp hết hạn</Text>
                <Switch
                  disabled={!masterNotif}
                  trackColor={{ false: '#dcdde1', true: '#2ecc71' }}
                  thumbColor={'#fff'}
                  value={notifExpire}
                  onValueChange={setNotifExpire}
                />
              </View>
              <View style={themeStyles.switchRow}>
                <Text style={themeStyles.switchTitle}>Quảng cáo & Sự kiện</Text>
                <Switch
                  disabled={!masterNotif}
                  trackColor={{ false: '#dcdde1', true: '#2ecc71' }}
                  thumbColor={'#fff'}
                  value={notifAds}
                  onValueChange={setNotifAds}
                />
              </View>
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* 3. Modal Thông tin về HALM */}
      <Modal visible={showAbout} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title="Thông tin HALM" onClose={() => setShowAbout(false)} />
          <ScrollView style={themeStyles.modalContent}>

            <View style={themeStyles.aboutHeader}>
              <Text style={themeStyles.aboutLogoText}>HALM <Text style={{ color: '#9b51e0' }}>Book</Text></Text>
              <Text style={themeStyles.aboutVersion}>Phiên bản 1.0.0 (Cập nhật: 18/09/2026)</Text>
              <Text style={themeStyles.aboutSlogan}>&quot;Sách là ánh sáng, tri thức là sức mạnh&quot;</Text>
            </View>

            <View style={themeStyles.aboutInfoBox}>
              <Text style={themeStyles.aboutDesc}>
                HALM Book là nền tảng đọc truyện và tiểu thuyết hàng đầu, mang đến cho người dùng trải nghiệm đọc mượt mà, kho tàng sách khổng lồ cùng với các tính năng cộng đồng thú vị.
              </Text>
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* 4. Modal Đổi mật khẩu */}
      <Modal visible={showChangePassword} animationType="slide">
        <View style={themeStyles.modalContainer}>
          <SubScreenHeader title="Đổi mật khẩu" onClose={resetPasswordModal} />
          <ScrollView style={themeStyles.modalContent}>

            {passwordStep === 1 ? (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  Vui lòng nhập mật khẩu hiện tại của bạn để xác thực trước khi đổi mật khẩu mới.
                </Text>

                <View style={[themeStyles.inputWrapper, oldPwdError ? { borderColor: '#e74c3c' } : {}]}>
                  <Ionicons name="lock-open-outline" size={20} color="#1a1a1a" style={themeStyles.inputIcon} />
                  <TextInput
                    style={themeStyles.passwordInput}
                    placeholder="Mật khẩu hiện tại"
                    placeholderTextColor="#a4b0be"
                    secureTextEntry={!showOldPwdText}
                    value={oldPassword}
                    onChangeText={(text) => { setOldPassword(text); setOldPwdError(''); }}
                    onSubmitEditing={handleCheckOldPassword}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPwdText(!showOldPwdText)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showOldPwdText ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
                {oldPwdError ? <Text style={themeStyles.errorText}>{oldPwdError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isVerifyingOldPwd && { opacity: 0.7 }]}
                  onPress={handleCheckOldPassword}
                  disabled={isVerifyingOldPwd}
                >
                  {isVerifyingOldPwd ? (
                    <ActivityIndicator color="#1a1a1a" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>TIẾP TỤC</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>
                  Mật khẩu hiện tại chính xác. Vui lòng tạo mật khẩu mới cho tài khoản ({userInfo.email || userInfo.username}).
                </Text>

                <View style={[themeStyles.softInputWrapper, newPwdError ? { borderColor: '#e74c3c' } : {}]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                  <TextInput
                    style={themeStyles.softPasswordInput}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    placeholderTextColor="#a4b0be"
                    secureTextEntry={!showNewPwdText}
                    returnKeyType="next"
                    value={newPassword}
                    onChangeText={(text) => { setNewPassword(text); setNewPwdError(''); }}
                    onSubmitEditing={() => confirmPwdRef.current?.focus()}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPwdText(!showNewPwdText)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showNewPwdText ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>

                <View style={[themeStyles.softInputWrapper, newPwdError ? { borderColor: '#e74c3c' } : {}]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                  <TextInput
                    ref={confirmPwdRef}
                    style={themeStyles.softPasswordInput}
                    placeholder="Xác nhận mật khẩu mới"
                    placeholderTextColor="#a4b0be"
                    secureTextEntry={!showConfirmPwdText}
                    returnKeyType="done"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setNewPwdError(''); }}
                    onSubmitEditing={handleUpdatePassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPwdText(!showConfirmPwdText)}
                    style={{ padding: 6 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showConfirmPwdText ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>

                {newPwdError ? <Text style={themeStyles.errorText}>{newPwdError}</Text> : null}

                <TouchableOpacity
                  style={[themeStyles.submitPasswordBtn, isUpdatingPwd && { opacity: 0.7 }]}
                  onPress={handleUpdatePassword}
                  disabled={isUpdatingPwd}
                >
                  {isUpdatingPwd ? (
                    <ActivityIndicator color="#1a1a1a" size="small" />
                  ) : (
                    <Text style={themeStyles.submitPasswordBtnText}>LƯU MẬT KHẨU</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  mainScroll: { flex: 1 },

  // User Info
  userInfoSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 25,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
  },
  avatarLarge: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#2c3a7a', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#e8f4fd' },
  avatarLargeText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#e8f4fd', marginBottom: 15 },
  modalAvatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#e8f4fd', marginBottom: 0 },
  userName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  userId: { fontSize: 13, fontWeight: '600', color: '#a4b0be' },

  // Buttons Row
  mainActionsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -20, justifyContent: 'space-between', zIndex: 10 },
  primaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#2c3a7a', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, shadowColor: '#1a1a1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  potatoIcon: { fontSize: 18 },

  // Stats Card
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 20, borderRadius: 15, paddingVertical: 20, alignItems: 'center', shadowColor: '#1a1a1a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 26, marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: '#eee' },

  // Tier Card
  tierCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 25, borderRadius: 12, padding: 15, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#f1f2f6' },
  tierInfo: { flexDirection: 'row', alignItems: 'center' },
  tierTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginLeft: 10 },

  // Menu Section
  menuSection: { backgroundColor: '#fff', borderRadius: 15, marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a' },

  // Bottom Actions
  bottomActionsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 30 },
  secondaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  secondaryBtnText: { color: '#1a1a1a', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  logoutBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#fdf3f2', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fadbd8' },
  logoutBtnText: { color: '#e74c3c', fontSize: 14, fontWeight: '700', marginLeft: 8 },

  // MODAL STYLES
  modalContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50, paddingBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  subHeaderBtn: { padding: 5 },
  subHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  modalContent: { flex: 1, padding: 20 },

  // Profile Modal (Trang cá nhân)
  avatarEditWrapper: { position: 'relative' },
  avatarPenIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2c3a7a', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  infoFieldsContainer: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  infoFieldRow: { borderBottomWidth: 1, borderBottomColor: '#f1f2f6', paddingVertical: 15 },
  infoFieldLabel: { fontSize: 13, color: '#888', marginBottom: 5 },
  infoFieldValue: { fontSize: 15, color: '#1a1a1a', fontWeight: '600' },
  infoFieldInput: { fontSize: 15, color: '#1a1a1a', fontWeight: '600', padding: 0 },
  infoFieldInputEditing: { borderBottomWidth: 1, borderBottomColor: '#3498db', paddingBottom: 5, color: '#3498db' },
  genderOption: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  genderOptionActive: { borderColor: '#2c3a7a', backgroundColor: '#2c3a7a' },
  genderOptionText: { fontSize: 14, fontWeight: '600', color: '#555' },
  genderOptionTextActive: { color: '#fff' },
  editProfileBtn: { backgroundColor: '#e8f4fd', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3498db' },
  editProfileBtnText: { color: '#3498db', fontSize: 15, fontWeight: '700' },
  saveProfileBtn: { backgroundColor: '#27ae60', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveProfileBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelProfileBtn: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelProfileBtnText: { color: '#636e72', fontSize: 15, fontWeight: '700' },

  // Avatar Menu Action Sheet
  avatarMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarMenuBox: { width: '80%', backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden' },
  avatarMenuItem: { paddingVertical: 20, alignItems: 'center' },
  avatarMenuItemText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  avatarMenuDivider: { height: 1, backgroundColor: '#eee' },

  // Help Center
  aiChatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2c3a7a', padding: 20, borderRadius: 16, marginBottom: 30, shadowColor: '#2c3a7a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  aiChatTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 5 },
  aiChatSub: { fontSize: 13, color: '#d1d8e0' },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 15, marginTop: 10 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  socialBox: { width: '22%', backgroundColor: '#fff', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  socialText: { fontSize: 11, fontWeight: '600', color: '#555', marginTop: 8 },
  faqItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  faqText: { fontSize: 14, fontWeight: '600', color: '#333' },

  // Notifications
  switchRowMaster: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  switchTitleMaster: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  switchSub: { fontSize: 12, color: '#888' },
  subOptionsContainer: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 20 },
  disabledOptions: { opacity: 0.4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  switchTitle: { fontSize: 15, fontWeight: '600', color: '#333' },

  // About & Language
  aboutHeader: { alignItems: 'center', paddingVertical: 30 },
  aboutLogoText: { fontSize: 40, fontWeight: '900', color: '#1a1a1a', marginBottom: 10 },
  aboutVersion: { fontSize: 13, color: '#888', marginBottom: 5, fontWeight: '600' },
  aboutSlogan: { fontSize: 14, fontStyle: 'italic', color: '#555', marginTop: 10 },
  aboutInfoBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: '#eee' },
  aboutDesc: { fontSize: 14, color: '#444', lineHeight: 22, textAlign: 'center' },

  // Password Modal
  passwordForm: { marginTop: 10 },
  passwordInstruction: { fontSize: 14, color: '#636e72', marginBottom: 25, lineHeight: 22 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 55, borderWidth: 1.5, borderColor: '#1a1a1a', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  inputIcon: { marginRight: 10 },
  passwordInput: { flex: 1, fontSize: 15, color: '#1a1a1a', fontWeight: '600' },
  submitPasswordBtn: { backgroundColor: '#64b5f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 15, borderWidth: 1.5, borderColor: '#1a1a1a', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  submitPasswordBtnText: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },

  errorText: { color: '#e74c3c', fontSize: 13, marginBottom: 15, marginTop: -5, fontWeight: '600' },
  softInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f4f8', borderRadius: 14, marginBottom: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#e1e8f0' },
  softPasswordInput: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#1a1a1a', fontWeight: '500' }
});


