import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const BRAND = {
  primary: '#9A8BC2',
  secondary: '#D8B36A',
};

// Hào quang tinh vân (Nebula)
const Nebula = React.memo(() => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: BRAND.primary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: BRAND.secondary,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.05] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }),
            },
          ],
        }}
      />
    </>
  );
});

// Sao băng rơi chéo màn hình
const ShootingStar = React.memo(({ delay, top, left }: { delay: number; top: string; left: string }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.8] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: top as any,
        left: left as any,
        width: 80,
        height: 2,
        backgroundColor: '#fff',
        transform: [{ rotate: '45deg' }, { translateX }, { translateY }],
        opacity,
        shadowColor: BRAND.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    />
  );
});

// Ngôi sao lấp lánh (Tối ưu số lượng và chu kỳ mượt)
const TwinkleStar = React.memo(
  ({
    duration,
    top,
    left,
    size,
    color,
  }: {
    duration: number;
    top: string;
    left: string;
    size: number;
    color: string;
  }) => {
    const anim = useRef(new Animated.Value(0.1)).current;

    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.1, duration, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [anim, duration]);

    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: top as any,
          left: left as any,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: anim,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 6,
        }}
      />
    );
  }
);

interface CosmicBackgroundProps {
  visible: boolean;
}

// Bầu trời sao tinh gọn, tiết kiệm 80% CPU & Pin so với render 120 vòng lặp liên tục
export const CosmicBackground = React.memo(({ visible }: CosmicBackgroundProps) => {
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim, visible]);

  const { stars, shootingStars } = useMemo(() => {
    const starList = Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      top: `${(i * 3.7 + Math.sin(i) * 5) % 100}%`,
      left: `${(i * 7.9 + Math.cos(i) * 8) % 100}%`,
      duration: 500 + (i % 7) * 150,
      size: (i % 3) + 1.5,
      color: i % 3 === 0 ? BRAND.secondary : i % 3 === 1 ? '#48dbfb' : BRAND.primary,
    }));

    const shootList = [
      { id: 'shoot_0', top: '-10%', left: '15%', delay: 3500 },
      { id: 'shoot_1', top: '-15%', left: '60%', delay: 8000 },
    ];

    return { stars: starList, shootingStars: shootList };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: opacityAnim, zIndex: 0, overflow: 'hidden' }]}
      pointerEvents="none"
    >
      <Nebula />
      {stars.map((s) => (
        <TwinkleStar
          key={s.id}
          top={s.top}
          left={s.left}
          duration={s.duration}
          size={s.size}
          color={s.color}
        />
      ))}
      {shootingStars.map((s) => (
        <ShootingStar key={s.id} top={s.top} left={s.left} delay={s.delay} />
      ))}
    </Animated.View>
  );
});

export default CosmicBackground;

