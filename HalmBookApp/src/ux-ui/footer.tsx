import React, { useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from './navigation';

export const PRIMARY_TABS = [
  { id: 'home', title: 'Trang Chủ', icon: 'home' },
  { id: 'offers', title: 'Ưu Đãi', icon: 'gift' },
  { id: 'upload', title: 'Upload', icon: 'cloud-upload' },
  { id: 'bookshelf', title: 'Tủ Sách', icon: 'library' },
  { id: 'profile', title: 'Tôi', icon: 'person' },
] as const;

interface FooterProps {
  activeNav: string;
  floating?: boolean;
  visible?: boolean;
}

function FooterComponent({ activeNav, floating = false, visible = true }: FooterProps) {
  // ============================================================================
  // [GIẢI THÍCH CODE]: Lấy trạng thái `isLoggedIn` và hàm `showLoginAlert` từ navigation
  // để kiểm tra xem người dùng hiện tại có phải khách vãng lai hay không.
  // ============================================================================
  const { navigateTab, isDarkMode, isLoggedIn, showLoginAlert, lang } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const animTranslateY = useRef(new Animated.Value(0)).current;

  // Hiệu ứng ẩn khi cuộn xuống và hiện khi cuộn lên mượt mà
  useEffect(() => {
    Animated.spring(animTranslateY, {
      toValue: visible ? 0 : 120,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [visible]);

  // ============================================================================
  // [GIẢI THÍCH CODE]: Xử lý sự kiện khi nhấn vào từng tab ở Footer
  // Nếu là khách vãng lai (!isLoggedIn):
  //  - Nhấn 'upload' -> thông báo: "Bạn phải đăng nhập mới dùng được chức năng uploadfile"
  //  - Nhấn 'bookshelf' (Tủ sách) -> thông báo: "Bạn phải đăng nhập để dùng chức năng tủ sách"
  //  - Nhấn 'profile' (Trang cá nhân) -> thông báo: "Bạn phải đăng nhập để dùng chức năng trang cá nhân"
  // Bản thông báo sẽ hiển thị kèm nút "Đăng nhập ngay" để điều hướng sang màn đăng nhập.
  // ============================================================================
  const handleTabPress = (tabId: (typeof PRIMARY_TABS)[number]['id']) => {
    if (!isLoggedIn) {
      if (tabId === 'upload') {
        showLoginAlert(lang === 'en' ? 'Please log in to use upload file feature' : 'Bạn phải đăng nhập mới dùng được chức năng uploadfile');
        return;
      }
      if (tabId === 'bookshelf') {
        showLoginAlert(lang === 'en' ? 'Please log in to use bookshelf feature' : 'Bạn phải đăng nhập để dùng chức năng tủ sách');
        return;
      }
      if (tabId === 'profile') {
        showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân');
        return;
      }
    }
    navigateTab(tabId);
  };

  return (
    <Animated.View
      pointerEvents={floating ? 'box-none' : 'auto'}
      style={[
        styles.footerWrap,
        floating && styles.footerWrapFloating,
        {
          paddingBottom: Math.max(insets.bottom, 8) + 6,
          transform: [{ translateY: animTranslateY }],
        },
      ]}
    >
      <View style={[styles.bottomNav, isDarkMode && styles.bottomNavDark]}>
        {PRIMARY_TABS.map((tab) => {
          const isActive = activeNav === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, isActive && styles.navItemActive, isDarkMode && isActive && styles.navItemActiveDark]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? (tab.id === 'home' ? 'Home' : tab.id === 'offers' ? 'Offers' : tab.id === 'upload' ? 'Upload' : tab.id === 'bookshelf' ? 'Bookshelf' : 'Profile') : tab.title}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={tab.icon}
                size={25}
                color={isActive ? '#1473E6' : isDarkMode ? '#AAB1C0' : '#6F7684'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default React.memo(FooterComponent);

const styles = StyleSheet.create({
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  footerWrapFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
    paddingTop: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 38,
    paddingHorizontal: 9,
    height: 68,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  bottomNavDark: {
    backgroundColor: '#20242D',
    shadowColor: '#000',
    shadowOpacity: 0.38,
  },
  navItem: {
    width: 55,
    height: 52,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    width: 72,
    backgroundColor: 'rgba(20, 115, 230, 0.12)',
  },
  navItemActiveDark: {
    backgroundColor: 'rgba(216, 179, 106, 0.16)',
  },
});
