import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';

export function ShimmerEffect({ style }: { style: any }) {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: '#E5E7EB',
          opacity,
        },
      ]}
    />
  );
}

export function TopCardsShimmer() {
  return (
    <View className="flex-row flex-wrap justify-between mb-4 mt-2">
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={{ width: '48%' }} className="p-4 rounded-xl mb-3 bg-white border border-gray-100">
          <View className="flex-row justify-between items-center mb-3">
            <ShimmerEffect style={{ width: 32, height: 32, borderRadius: 8 }} />
            <ShimmerEffect style={{ width: 24, height: 24, borderRadius: 4 }} />
          </View>
          <ShimmerEffect style={{ width: 80, height: 16, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

export function IssueListShimmer() {
  return (
    <View className="flex-1 mt-4">
      <View className="flex-row justify-between items-center mb-4 px-1">
        <ShimmerEffect style={{ width: 120, height: 24, borderRadius: 4 }} />
        <ShimmerEffect style={{ width: 100, height: 36, borderRadius: 8 }} />
      </View>
      {[1, 2, 3].map((item) => (
        <View key={item} className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
          <View className="flex-row justify-between items-center mb-3">
            <ShimmerEffect style={{ width: 100, height: 20, borderRadius: 4 }} />
            <ShimmerEffect style={{ width: 60, height: 24, borderRadius: 12 }} />
          </View>
          <View className="mb-3">
            <ShimmerEffect style={{ width: 150, height: 16, borderRadius: 4, marginBottom: 8 }} />
            <ShimmerEffect style={{ width: '100%', height: 40, borderRadius: 4 }} />
          </View>
          <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
            <ShimmerEffect style={{ width: 80, height: 12, borderRadius: 4 }} />
            <View className="flex-row gap-2">
              <ShimmerEffect style={{ width: 30, height: 30, borderRadius: 15 }} />
              <ShimmerEffect style={{ width: 30, height: 30, borderRadius: 15 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
