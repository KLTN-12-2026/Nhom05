import React, { useEffect, useRef } from 'react';
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
      toValue: visible ? 0 : 100 + insets.bottom,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [visible, insets.bottom, animTranslateY]);

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
        showLoginAlert(lang === 'en' ? 'Please log in to use upload file feature' : 'Bạn phải đăng nhập mới dùng được chức năng uploadfile', () => navigateTab('upload'));
        return;
      }
      if (tabId === 'bookshelf') {
        showLoginAlert(lang === 'en' ? 'Please log in to use bookshelf feature' : 'Bạn phải đăng nhập để dùng chức năng tủ sách', () => navigateTab('bookshelf'));
        return;
      }
      if (tabId === 'profile') {
        showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân', () => navigateTab('profile'));
        return;
      }
    }
    navigateTab(tabId);
  };

  return (
    <Animated.View
      pointerEvents={!visible ? 'none' : floating ? 'box-none' : 'auto'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.footerWrap,
        floating && styles.footerWrapFloating,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
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
              style={styles.navItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? (tab.id === 'home' ? 'Home' : tab.id === 'offers' ? 'Offers' : tab.id === 'upload' ? 'Upload' : tab.id === 'bookshelf' ? 'Bookshelf' : 'Profile') : tab.title}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={isActive ? (isDarkMode ? '#E5A93C' : '#35695F') : isDarkMode ? '#A39F99' : '#77736C'}
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
    borderRadius: 20,
    paddingHorizontal: 8,
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#E6E1D8',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
  },
  bottomNavDark: {
    backgroundColor: '#242321',
    borderColor: '#383633',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderRadius: 6,
    paddingVertical: 4,
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
