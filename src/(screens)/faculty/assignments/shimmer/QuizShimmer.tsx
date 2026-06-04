import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export default function QuizSkeleton() {
  const animatedValue = useRef(new Animated.Value(0)).current;

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
    <View className="w-full flex-col gap-3">
      {[1, 2, 3].map((item) => (
        <View key={item} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-col gap-3 mb-3">
          <View className="pr-16">
            <Animated.View style={{ opacity }} className="h-5 w-3/4 bg-gray-200 rounded mb-1" />
            <Animated.View style={{ opacity }} className="h-4 w-1/2 bg-gray-200 rounded" />
          </View>
          <View className="flex-col gap-2.5 mt-2">
            <View className="flex-row items-center gap-4">
              <Animated.View style={{ opacity }} className="h-4 w-20 bg-gray-200 rounded" />
              <Animated.View style={{ opacity }} className="h-4 w-16 bg-gray-200 rounded" />
            </View>
            <View className="flex-row items-center gap-4">
              <Animated.View style={{ opacity }} className="h-4 w-28 bg-gray-200 rounded" />
              <Animated.View style={{ opacity }} className="h-4 w-10 bg-gray-200 rounded" />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <Animated.View style={{ opacity }} className="h-4 w-24 bg-gray-200 rounded" />
                <Animated.View style={{ opacity }} className="h-4 w-12 bg-gray-200 rounded" />
              </View>
              <Animated.View style={{ opacity }} className="h-4 w-24 bg-gray-200 rounded" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
