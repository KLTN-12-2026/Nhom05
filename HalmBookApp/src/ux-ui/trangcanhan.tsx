import React, { ComponentRef, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Switch, Image, Platform, StatusBar, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation, useAppThemeStyles } from './navigation';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

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
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPwdError, setNewPwdError] = useState('');
  
  const confirmPwdRef = useRef<ComponentRef<typeof TextInput>>(null);

  const handleCheckOldPassword = () => {
    if (oldPassword === '123456') {
      setOldPwdError('');
      setPasswordStep(2);
    } else {
      setOldPwdError('Mật khẩu không chính xác. Vui lòng nhập lại (thử: 123456).');
    }
  };

  const handleUpdatePassword = () => {
    if (!newPassword || !confirmPassword) {
      setNewPwdError('Vui lòng điền đầy đủ mật khẩu mới.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setNewPwdError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    // Đổi mật khẩu thành công
    alert('Đổi mật khẩu thành công!');
    setShowChangePassword(false);
    setPasswordStep(1);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewPwdError('');
  };

  const resetPasswordModal = () => {
    setShowChangePassword(false);
    setPasswordStep(1);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOldPwdError('');
    setNewPwdError('');
  };

  // Trạng thái cài đặt thông báo
  const [masterNotif, setMasterNotif] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifExpire, setNotifExpire] = useState(true);
  const [notifAds, setNotifAds] = useState(false);

  // Trạng thái ngôn ngữ
  const [lang, setLang] = useState('vi'); // vi or en

  // Trang cá nhân
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    name: 'Nguyễn Văn Mạnh',
    username: 'manh123',
    email: 'manh@gmail.com',
    phone: '0123456789',
    gender: 'Nam',
    dob: '15/08/2000'
  });

  // Component Sub-Screen Header
  const SubScreenHeader = ({ title, onClose }: { title: string, onClose: () => void }) => (
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
      
      <ScrollView showsVerticalScrollIndicator={false} style={themeStyles.mainScroll}>
        
        {/* Phần thông tin User */}
        <View style={themeStyles.userInfoSection}>
          <View style={themeStyles.avatarLarge}>
            <Text style={themeStyles.avatarLargeText}>M</Text>
          </View>
          <Text style={themeStyles.userName}>Nguyễn Văn Mạnh</Text>
          <Text style={themeStyles.userId}>#ID: 11111</Text>
        </View>

        {/* Cụm 2 nút thao tác chính */}
        <View style={themeStyles.mainActionsRow}>
          <TouchableOpacity style={themeStyles.primaryBtn} onPress={() => setShowProfile(true)}>
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
            <Text style={themeStyles.statValue}>1,250</Text>
            <Text style={themeStyles.statLabel}>Khoai đang có</Text>
          </View>
          <View style={themeStyles.statDivider} />
          <View style={themeStyles.statItem}>
            <Ionicons name="library-outline" size={28} color="#2c3a7a" />
            <Text style={themeStyles.statValue}>42</Text>
            <Text style={themeStyles.statLabel}>Sách đã đọc</Text>
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
            <Text style={themeStyles.tierTitle}>Hạng: Cao Thủ Cày</Text>
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

          <TouchableOpacity style={themeStyles.menuItem} onPress={() => setShowChangePassword(true)}>
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
          <SubScreenHeader title="Thông tin cá nhân" onClose={() => { setShowProfile(false); setIsEditingProfile(false); }} />
          <ScrollView style={themeStyles.modalContent}>
            
            {/* Avatar & Edit icon */}
            <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 30 }}>
              <TouchableOpacity onPress={() => setShowAvatarMenu(true)} style={themeStyles.avatarEditWrapper}>
                <View style={[themeStyles.avatarLarge, { marginBottom: 0, width: 100, height: 100, borderRadius: 50 }]}>
                  <Text style={themeStyles.avatarLargeText}>M</Text>
                </View>
                <View style={themeStyles.avatarPenIcon}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* User Info Fields */}
            <View style={themeStyles.infoFieldsContainer}>
              {[
                { key: 'name', label: 'Họ tên', value: userInfo.name },
                { key: 'username', label: 'Tên đăng nhập', value: userInfo.username },
                { key: 'email', label: 'Email', value: userInfo.email },
                { key: 'phone', label: 'Số điện thoại', value: userInfo.phone },
                { key: 'gender', label: 'Giới tính', value: userInfo.gender },
                { key: 'dob', label: 'Ngày sinh', value: userInfo.dob },
              ].map((field) => (
                <View key={field.key} style={themeStyles.infoFieldRow}>
                  <Text style={themeStyles.infoFieldLabel}>{field.label}</Text>
                  {isEditingProfile ? (
                    <TextInput 
                      style={[themeStyles.infoFieldInput, isEditingProfile && themeStyles.infoFieldInputEditing]}
                      value={field.value}
                      onChangeText={(text) => setUserInfo({...userInfo, [field.key as keyof typeof userInfo]: text})}
                    />
                  ) : (
                    <Text style={themeStyles.infoFieldValue}>{field.value}</Text>
                  )}
                </View>
              ))}
            </View>

            {!isEditingProfile ? (
              <TouchableOpacity style={themeStyles.editProfileBtn} onPress={() => setIsEditingProfile(true)}>
                <Text style={themeStyles.editProfileBtnText}>Thay đổi thông tin</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={themeStyles.saveProfileBtn} onPress={() => setIsEditingProfile(false)}>
                <Text style={themeStyles.saveProfileBtnText}>Lưu thay đổi</Text>
              </TouchableOpacity>
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
                <Text style={themeStyles.passwordInstruction}>Vui lòng nhập mật khẩu hiện tại của bạn để xác thực.</Text>
                
                <View style={[themeStyles.inputWrapper, oldPwdError ? { borderColor: '#e74c3c' } : {}]}>
                  <Ionicons name="lock-open-outline" size={20} color="#1a1a1a" style={themeStyles.inputIcon} />
                  <TextInput 
                    style={themeStyles.passwordInput} 
                    placeholder="Mật khẩu hiện tại" 
                    placeholderTextColor="#a4b0be" 
                    secureTextEntry 
                    value={oldPassword}
                    onChangeText={(text) => { setOldPassword(text); setOldPwdError(''); }}
                    onSubmitEditing={handleCheckOldPassword}
                    autoFocus
                  />
                </View>
                {oldPwdError ? <Text style={themeStyles.errorText}>{oldPwdError}</Text> : null}

                <TouchableOpacity style={themeStyles.submitPasswordBtn} onPress={handleCheckOldPassword}>
                  <Text style={themeStyles.submitPasswordBtnText}>TIẾP TỤC</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={themeStyles.passwordForm}>
                <Text style={themeStyles.passwordInstruction}>Mật khẩu cũ chính xác. Vui lòng tạo mật khẩu mới.</Text>
                
                <View style={[themeStyles.softInputWrapper, newPwdError ? { borderColor: '#e74c3c' } : {}]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                  <TextInput 
                    style={themeStyles.softPasswordInput} 
                    placeholder="Mật khẩu mới" 
                    placeholderTextColor="#a4b0be" 
                    secureTextEntry 
                    returnKeyType="next"
                    value={newPassword}
                    onChangeText={(text) => { setNewPassword(text); setNewPwdError(''); }}
                    onSubmitEditing={() => confirmPwdRef.current?.focus()}
                    autoFocus
                  />
                </View>
                
                <View style={[themeStyles.softInputWrapper, newPwdError ? { borderColor: '#e74c3c' } : {}]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#888" style={themeStyles.inputIcon} />
                  <TextInput 
                    ref={confirmPwdRef}
                    style={themeStyles.softPasswordInput} 
                    placeholder="Xác nhận mật khẩu mới" 
                    placeholderTextColor="#a4b0be" 
                    secureTextEntry 
                    returnKeyType="done"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setNewPwdError(''); }}
                    onSubmitEditing={handleUpdatePassword}
                  />
                </View>
                
                {newPwdError ? <Text style={themeStyles.errorText}>{newPwdError}</Text> : null}

                <TouchableOpacity style={themeStyles.submitPasswordBtn} onPress={handleUpdatePassword}>
                  <Text style={themeStyles.submitPasswordBtnText}>Here We Go</Text>
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

  // Footer Navigation
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  navText: { fontSize: 10, fontWeight: '700', color: '#8f9bb3', marginTop: 4 },
  navActiveText: { color: '#2c3a7a', fontWeight: '900' },

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
  editProfileBtn: { backgroundColor: '#e8f4fd', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3498db' },
  editProfileBtnText: { color: '#3498db', fontSize: 15, fontWeight: '700' },
  saveProfileBtn: { backgroundColor: '#27ae60', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveProfileBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

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
  aboutInfoBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: '#eee', lineHeight: 22 },
  aboutDesc: { fontSize: 14, color: '#444', lineHeight: 22, textAlign: 'center' },
  langContainer: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15 },
  langBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  langText: { fontSize: 15, fontWeight: '600', color: '#555' },
  langTextActive: { color: '#2c3a7a', fontWeight: '800' },
  langDivider: { height: 1, backgroundColor: '#f1f2f6' },

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
