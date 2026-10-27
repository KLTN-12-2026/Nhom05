import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
}

export default function Footer({ activeNav, floating = false }: FooterProps) {
  const { navigateTab, isDarkMode } = useAppNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents={floating ? 'box-none' : 'auto'}
      style={[
        styles.footerWrap,
        floating && styles.footerWrapFloating,
        { paddingBottom: Math.max(insets.bottom, 8) + 6 },
      ]}
    >
      <View style={[styles.bottomNav, isDarkMode && styles.bottomNavDark]}>
        {PRIMARY_TABS.map((tab) => {
          const isActive = activeNav === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, isActive && styles.navItemActive, isDarkMode && isActive && styles.navItemActiveDark]}
              onPress={() => navigateTab(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tab.title}
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
    </View>
  );
}

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
    backgroundColor: '#E6F0FF',
  },
  navItemActiveDark: {
    backgroundColor: '#303D52',
  },
});
