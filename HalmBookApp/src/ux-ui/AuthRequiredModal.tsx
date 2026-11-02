import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthRequiredModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  onLogin: () => void;
  isDarkMode?: boolean;
}

/**
 * ============================================================================
 * [GIẢI THÍCH CODE]: Modal bản thông báo yêu cầu đăng nhập dành cho khách vãng lai
 * ============================================================================
 * Khi khách vãng lai (chưa đăng nhập) nhấn vào các tính năng bị giới hạn như:
 *  - Upload file ('Bạn phải đăng nhập mới dùng được chức năng uploadfile')
 *  - Trang cá nhân ('Bạn phải đăng nhập để dùng chức năng trang cá nhân')
 *  - Tủ sách ('Bạn phải đăng nhập để dùng chức năng tủ sách')
 *  - Thanh toán giỏ hàng ('Bạn phải đăng nhập để thanh toán')
 *
 * Bản thông báo này sẽ hiển thị thông báo tương ứng và cung cấp dòng nút
 * 'Đăng nhập ngay'. Khi người dùng nhấn nút này, modal sẽ đóng và ứng dụng
 * sẽ điều hướng trực tiếp sang màn hình Đăng nhập (Auth).
 * Ngoài ra còn có nút 'Để sau' để người dùng có thể đóng bảng thông báo
 * và tiếp tục trải nghiệm các tính năng công khai khác.
 * ============================================================================
 */
export default function AuthRequiredModal({
  visible,
  message,
  onClose,
  onLogin,
  isDarkMode = false,
}: AuthRequiredModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Khung nội dung thông báo - Tương thích cả Light Mode và Dark Mode */}
        <View style={[styles.dialogCard, isDarkMode && styles.dialogCardDark]}>
          {/* Biểu tượng ổ khóa / tài khoản làm điểm nhấn trực quan */}
          <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
            <Ionicons
              name="lock-closed"
              size={30}
              color={isDarkMode ? '#D8B36A' : '#9147DF'}
            />
          </View>

          {/* Tiêu đề thông báo */}
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Yêu cầu đăng nhập
          </Text>

          {/* Dòng mô tả chi tiết lý do cần đăng nhập */}
          <Text style={[styles.message, isDarkMode && styles.messageDark]}>
            {message}
          </Text>

          {/* Nhóm các nút tương tác */}
          <View style={styles.buttonContainer}>
            {/* DÒNG NÚT: ĐĂNG NHẬP NGAY (Chuyển sang màn đăng nhập khi nhấn) */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={onLogin}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Đăng nhập ngay"
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>

            {/* Nút đóng / Để sau nếu khách vãng lai chưa muốn đăng nhập lúc này */}
            <TouchableOpacity
              style={[styles.cancelBtn, isDarkMode && styles.cancelBtnDark]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Để sau"
            >
              <Text style={[styles.cancelBtnText, isDarkMode && styles.cancelBtnTextDark]}>
                Để sau
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  dialogCardDark: {
    backgroundColor: '#1E232D',
    borderColor: '#4A5160',
    shadowColor: '#000',
    shadowOpacity: 0.5,
  },
  iconContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(145, 71, 223, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(145, 71, 223, 0.25)',
  },
  iconContainerDark: {
    backgroundColor: 'rgba(216, 179, 106, 0.16)',
    borderColor: 'rgba(216, 179, 106, 0.35)',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleDark: {
    color: '#F5F1E8',
  },
  message: {
    fontSize: 14.5,
    color: '#4B5563',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  messageDark: {
    color: '#C7CAD1',
  },
  buttonContainer: {
    width: '100%',
    gap: 8,
  },
  loginBtn: {
    backgroundColor: '#9147DF',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9147DF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelBtnDark: {},
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtnTextDark: {
    color: '#9CA3AF',
  },
});

