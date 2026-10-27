import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppNavigation } from './navigation';

interface SharedHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  blurTarget: RefObject<View | null>;
  compact?: boolean;
}

export default function SharedHeader({
  isDarkMode,
  onToggleDarkMode,
  blurTarget,
  compact = false,
}: SharedHeaderProps) {
  const { navigate, navigateTab } = useAppNavigation();
  const foreground = isDarkMode ? '#F5F1E8' : '#11131A';

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
          <TouchableOpacity
            style={styles.logo}
            onPress={() => navigateTab('home')}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ HALM BOOK"
          >
            <MaterialCommunityIcons name="book-open-page-variant" size={29} color="#9147DF" />
            <Text style={[styles.logoText, { color: foreground }]}>HALM BOOK</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigate('transactions')}
              accessibilityRole="button"
              accessibilityLabel="Lịch sử giao dịch"
            >
              <MaterialCommunityIcons name="bell-outline" size={23} color={foreground} />
              <View style={styles.notice} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigate('cart')}
              accessibilityRole="button"
              accessibilityLabel="Giỏ hàng"
            >
              <Ionicons name="cart-outline" size={23} color={foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigateTab('profile')}
              accessibilityRole="button"
              accessibilityLabel="Trang cá nhân"
            >
              <MaterialCommunityIcons name="account" size={24} color="#9147DF" />
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
              accessibilityLabel="Tìm kiếm truyện"
            >
              <Ionicons name="search" size={19} color={isDarkMode ? '#D1C6EA' : '#6F687C'} />
              <Text style={[styles.searchText, { color: isDarkMode ? '#C6C8D0' : '#77717F' }]}>
                Tìm kiếm truyện...
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
