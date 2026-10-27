import { createContext, useContext, useMemo } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export type AppScreen =
  | 'auth'
  | 'home'
  | 'dmHome'
  | 'offers'
  | 'upload'
  | 'bookshelf'
  | 'profile'
  | 'categories'
  | 'search'
  | 'cart'
  | 'transactions'
  | 'reader'
  | 'payment'
  | 'chatbot'
  | 'bookDetail';

export interface BookData {
  id: string;
  title: string;
  author?: string;
  chapter?: string;
  tag?: string;
  pages?: number;
  reads?: string;
  rating?: string;
}

interface NavigationContextValue {
  navigate: (screen: AppScreen, book?: BookData) => void;
  navigateTab: (screen: AppScreen) => void;
  goBack: () => void;
  logout: () => void;
  isDarkMode: boolean;
}

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useAppNavigation() {
  const navigation = useContext(NavigationContext);
  if (!navigation) {
    throw new Error('useAppNavigation must be used inside the app navigation provider.');
  }
  return navigation;
}

type AppStyleSheet = Record<string, ViewStyle | TextStyle>;

function colorChannels(color: string): number[] | null {
  const value = color.trim().toLowerCase();
  if (value.startsWith('#')) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.slice(0, 3).split('').map((part) => part + part).join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
    }
  }
  const rgb = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return rgb ? rgb.slice(1, 4).map(Number) : null;
}

function luminance(color: string) {
  const rgb = colorChannels(color);
  return rgb ? (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722) / 255 : 0;
}

function isNeutral(color: string) {
  const rgb = colorChannels(color);
  return rgb !== null && Math.max(...rgb) - Math.min(...rgb) < 34;
}

function darkenStyle(style: ViewStyle | TextStyle): ViewStyle | TextStyle {
  const darkStyle = { ...style };
  const backgroundColor = darkStyle.backgroundColor;
  if (typeof backgroundColor === 'string' && isNeutral(backgroundColor) && luminance(backgroundColor) > 0.72) {
    darkStyle.backgroundColor = luminance(backgroundColor) > 0.92 ? '#1B1F28' : '#232833';
  }
  if ('color' in darkStyle && typeof darkStyle.color === 'string' && isNeutral(darkStyle.color)) {
    darkStyle.color = luminance(darkStyle.color) < 0.42 ? '#E4E6EB' : '#B4B9C4';
  }
  const borderColor = darkStyle.borderColor;
  if (typeof borderColor === 'string' && isNeutral(borderColor)) {
    darkStyle.borderColor = luminance(borderColor) < 0.35 ? '#424854' : '#343A45';
  }
  return darkStyle;
}

export function useAppThemeStyles<T extends AppStyleSheet>(styles: T): T {
  const { isDarkMode } = useAppNavigation();
  return useMemo(
    () => isDarkMode
      ? Object.fromEntries(
          Object.entries(styles).map(([name, style]) => [name, darkenStyle(StyleSheet.flatten(style) ?? {})]),
        ) as T
      : styles,
    [isDarkMode, styles],
  );
}
