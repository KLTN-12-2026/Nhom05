import React, { ComponentRef, RefObject, useEffect, useState } from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppNavigation } from './navigation';
import { getUnreadNotificationCount } from './notificationService';

interface SharedHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
  compact?: boolean;
  currentScreen?: string;
}

function SharedHeaderComponent({
  isDarkMode,
  onToggleDarkMode,
  blurTarget,
  compact = false,
  currentScreen,
}: SharedHeaderProps) {
  const { navigate, navigateTab, isLoggedIn, showLoginAlert, userAvatarUrl, userInitial, lang } = useAppNavigation();
  // [GIẢI THÍCH CODE]: Chỉ áp dụng avatar giống trang cá nhân trên tủ sách, ưu đãi và uploadfile
  const isProfileAvatarScreen = ['offers', 'upload', 'bookshelf'].includes(currentScreen || '');
  const foreground = isDarkMode ? '#F5F1E8' : '#11131A';

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
  }, [currentScreen]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <BlurView
        intensity={80}
        tint={isDarkMode ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={blurTarget}
        style={[
          styles.header,
          { backgroundColor: isDarkMode ? 'rgba(16,19,25,0.78)' : 'rgba(255,255,255,0.78)' },
        ]}
      >
        <View style={styles.brandRow}>
          {currentScreen === 'bookshelf' ? (
            <View style={styles.bookshelfHeader}>
              <Text style={[styles.bookshelfTitle, { color: foreground }]}>
                {lang === 'en' ? 'Your Bookshelf' : 'Tủ sách của bạn'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.logo}
              onPress={() => navigateTab('home')}
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? 'Back to HALM BOOK Home' : 'Về trang chủ HALM BOOK'}
            >
              <MaterialCommunityIcons name="book-open-page-variant" size={29} color="#9147DF" />
              <Text style={[styles.logoText, { color: foreground }]}>HALM BOOK</Text>
            </TouchableOpacity>
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigate('notifications')}
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? 'Notifications' : 'Thông báo'}
            >
              <MaterialCommunityIcons name="bell-outline" size={23} color={foreground} />
              {unreadCount > 0 && <View style={styles.notice} />}
            </TouchableOpacity>
            {/* ============================================================================
                [GIẢI THÍCH CODE]: Nút tìm kiếm (khi ở Tủ Sách) hoặc Giỏ hàng (màn hình khác)
                ============================================================================ */}
            {currentScreen === 'bookshelf' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigate('search')}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Search' : 'Tìm kiếm'}
              >
                <Ionicons name="search-outline" size={23} color={foreground} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (!isLoggedIn) {
                    showLoginAlert(lang === 'en' ? 'Please log in to use cart feature' : 'Bạn phải đăng nhập để dùng chức năng giỏ hàng');
                    return;
                  }
                  navigate('cart');
                }}
                accessibilityRole="button"
                accessibilityLabel={lang === 'en' ? 'Cart' : 'Giỏ hàng'}
              >
                <Ionicons name="cart-outline" size={23} color={foreground} />
              </TouchableOpacity>
            )}
            {/* ============================================================================
                [GIẢI THÍCH CODE]: Khách vãng lai nhấn vào icon trang cá nhân ở header
                Hiển thị thông báo: "Bạn phải đăng nhập để dùng chức năng trang cá nhân"
                kèm dòng nút "Đăng nhập ngay" để điều hướng sang màn đăng nhập.
                ============================================================================ */}
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => {
                if (!isLoggedIn) {
                  showLoginAlert(lang === 'en' ? 'Please log in to use profile feature' : 'Bạn phải đăng nhập để dùng chức năng trang cá nhân');
                  return;
                }
                navigateTab('profile');
              }}
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? 'Profile' : 'Trang cá nhân'}
            >
              {isProfileAvatarScreen && isLoggedIn ? (
                userAvatarUrl ? (
                  // [GIẢI THÍCH CODE]: Hiển thị ảnh avatar đồng bộ trang cá nhân cho ưu đãi, tủ sách, uploadfile
                  <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
                ) : (
                  // [GIẢI THÍCH CODE]: Chữ cái đầu hiển thị trên nền #2c3a7a giống hệt trang cá nhân
                  <View style={styles.avatarLetterCircle}>
                    <Text style={styles.avatarText}>{userInitial || 'H'}</Text>
                  </View>
                )
              ) : (
                <MaterialCommunityIcons name="account" size={24} color="#9147DF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {!compact && (
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDarkMode ? 'rgba(39,43,51,0.88)' : 'rgba(255,255,255,0.72)',
                  borderColor: isDarkMode ? '#4F5766' : '#d8d6df',
                },
              ]}
              onPress={() => navigate('search')}
              accessibilityRole="button"
              accessibilityLabel={lang === 'en' ? 'Search books' : 'Tìm kiếm truyện'}
            >
              <Ionicons name="search" size={19} color={isDarkMode ? '#D1C6EA' : '#6F687C'} />
              <Text style={[styles.searchText, { color: isDarkMode ? '#C6C8D0' : '#77717F' }]}>
                {lang === 'en' ? 'Search books...' : 'Tìm kiếm truyện...'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeButton, { backgroundColor: isDarkMode ? '#D8B36A' : '#fff' }]}
              onPress={onToggleDarkMode}
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
            >
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={21}
                color={isDarkMode ? '#161920' : '#1a1a1a'}
              />
            </TouchableOpacity>
          </View>
        )}
      </BlurView>
    </SafeAreaView>
  );
}

export default React.memo(SharedHeaderComponent);

const styles = StyleSheet.create({
  safeArea: { backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120,120,130,0.24)',
  },
  brandRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookshelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookshelfTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoText: { fontSize: 19, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    position: 'absolute',
    right: 5,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4E55',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#9147DF',
    backgroundColor: '#F2E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarLetterCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c3a7a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    height: 42,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 15,
  },
  searchText: { fontSize: 14, fontWeight: '600' },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(90,90,100,0.25)',
  },
});
