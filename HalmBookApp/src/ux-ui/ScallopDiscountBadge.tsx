import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ScallopDiscountBadgeProps {
  percent: number;
  size?: number;
  style?: ViewStyle;
}

/**
 * Badge giảm giá hình hoa thị lượn sóng (scalloped circle) màu vàng
 * Thiết kế chuẩn theo mẫu tem giảm giá -{pct}%
 */
export const ScallopDiscountBadge: React.FC<ScallopDiscountBadgeProps> = ({
  percent,
  size = 44,
  style,
}) => {
  // SVG path hình hoa thị 12 cánh lượn sóng mềm mại (viewBox 0 0 48 48)
  const pathD =
    'M 21.61 3.82 Q 24.00 1.50, 26.39 3.82 Q 28.79 6.13, 32.02 5.32 Q 35.25 4.51, 36.17 7.72 Q 37.08 10.92, 40.28 11.83 Q 43.49 12.75, 42.68 15.98 Q 41.87 19.21, 44.18 21.61 Q 46.50 24.00, 44.18 26.39 Q 41.87 28.79, 42.68 32.02 Q 43.49 35.25, 40.28 36.17 Q 37.08 37.08, 36.17 40.28 Q 35.25 43.49, 32.02 42.68 Q 28.79 41.87, 26.39 44.18 Q 24.00 46.50, 21.61 44.18 Q 19.21 41.87, 15.98 42.68 Q 12.75 43.49, 11.83 40.28 Q 10.92 37.08, 7.72 36.17 Q 4.51 35.25, 5.32 32.02 Q 6.13 28.79, 3.82 26.39 Q 1.50 24.00, 3.82 21.61 Q 6.13 19.21, 5.32 15.98 Q 4.51 12.75, 7.72 11.83 Q 10.92 10.92, 11.83 7.72 Q 12.75 4.51, 15.98 5.32 Q 19.21 6.13, 21.61 3.82 Z';

  const fontSize = Math.round(size * 0.29);
  const percentFontSize = Math.round(fontSize * 0.75);

  return (
    <View style={[styles.container, { width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 48 48" style={StyleSheet.absoluteFill}>
        {/* Lớp nền vàng hoa thị nổi bật */}
        <Path
          d={pathD}
          fill="#FFB800"
          stroke="#E69500"
          strokeWidth="1.2"
        />
      </Svg>
      {/* Chữ hiển thị -{percent}% in đậm màu đen */}
      <View style={styles.textWrapper}>
        <Text style={[styles.textValue, { fontSize }]}>-{percent}</Text>
        <Text style={[styles.textPercent, { fontSize: percentFontSize }]}>%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  textValue: {
    color: '#000000',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  textPercent: {
    color: '#000000',
    fontWeight: '900',
    marginLeft: 0.5,
  },
});

export default ScallopDiscountBadge;
