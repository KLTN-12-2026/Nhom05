import { Bot } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SIZE = 60;
const GAP = 12;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

interface Props {
  onOpen: () => void;
  isDarkMode: boolean;
  isEnglish: boolean;
  hidden?: boolean;
}

/** Root overlay shared by every screen; never participates in the screen layout. */
export default function FloatingChatbotBubble({ onOpen, isDarkMode, isEnglish, hidden }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const limits = useMemo(() => {
    const left = Math.min(insets.left + GAP, Math.max(0, width - SIZE));
    const top = Math.min(insets.top + GAP, Math.max(0, height - SIZE));
    return {
      left,
      right: Math.max(left, width - insets.right - SIZE - GAP),
      top,
      bottom: Math.max(top, height - insets.bottom - SIZE - GAP),
    };
  }, [width, height, insets.left, insets.right, insets.top, insets.bottom]);
  const position = useRef(new Animated.ValueXY({ x: limits.right, y: Math.max(limits.top, limits.bottom - 90) })).current;
  const current = useRef({ x: limits.right, y: Math.max(limits.top, limits.bottom - 90) });
  const start = useRef(current.current);
  const edge = useRef<'left' | 'right'>('right');
  const dragged = useRef(false);

  useEffect(() => {
    const listener = position.addListener(value => { current.current = value; });
    return () => position.removeListener(listener);
  }, [position]);

  useEffect(() => {
    position.stopAnimation();
    position.setValue({ x: limits[edge.current], y: clamp(current.current.y, limits.top, limits.bottom) });
  }, [limits, position]);

  useEffect(() => () => position.stopAnimation(), [position]);

  const responder = useMemo(() => {
    const snap = () => {
      edge.current = current.current.x - limits.left < limits.right - current.current.x ? 'left' : 'right';
      Animated.spring(position, {
        toValue: { x: limits[edge.current], y: clamp(current.current.y, limits.top, limits.bottom) },
        useNativeDriver: false,
        overshootClamping: true,
        speed: 22,
        bounciness: 0,
        isInteraction: false,
      }).start();
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.hypot(gesture.dx, gesture.dy) > 6,
      onPanResponderGrant: () => {
        dragged.current = true;
        position.stopAnimation();
        start.current = { ...current.current };
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({
          x: clamp(start.current.x + gesture.dx, limits.left, limits.right),
          y: clamp(start.current.y + gesture.dy, limits.top, limits.bottom),
        });
      },
      onPanResponderRelease: snap,
      onPanResponderTerminate: snap,
      onPanResponderTerminationRequest: () => false,
    });
  }, [limits, position]);

  if (hidden) return null;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.overlay, { left: position.x, top: position.y }, Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle)]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isEnglish ? 'Open HALM AI chatbot' : 'Mở trợ lý HALM AI'}
        accessibilityHint={isEnglish ? 'Tap to chat or drag to move' : 'Chạm để trò chuyện, kéo để di chuyển'}
        onPressIn={() => { dragged.current = false; }}
        onPress={() => { if (!dragged.current) onOpen(); }}
        style={({ pressed }) => [styles.button, { backgroundColor: isDarkMode ? '#272134' : '#7B1E26', opacity: pressed ? 0.85 : 1 }]}
      >
        <Bot color="#FFF5D6" size={29} strokeWidth={1.8} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    zIndex: 10000,
    elevation: 24,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    boxShadow: '0 5px 18px rgba(0, 0, 0, 0.24)',
  },
});
