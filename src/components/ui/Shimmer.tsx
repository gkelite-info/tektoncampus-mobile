import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type ShimmerProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
};

export default function Shimmer({ width = '100%', height = 20, borderRadius = 4, className }: ShimmerProps) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerValue.value, [0, 1], [-300, 300]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', overflow: 'hidden' }]}
      className={className}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
