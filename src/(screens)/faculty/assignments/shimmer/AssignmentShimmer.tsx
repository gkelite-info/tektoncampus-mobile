import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export default function AssignmentSkeleton() {
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
        <View key={item} className="flex-row bg-white rounded-xl p-3 shadow-sm border border-gray-100 w-full mb-3">
          <Animated.View style={{ opacity }} className="w-[70px] h-[70px] rounded-lg bg-gray-200 shrink-0" />
          
          <View className="flex-1 flex-col py-0.5 ml-3">
            <View className="flex-row justify-between items-start w-full">
              <View className="flex-1 space-y-2">
                <Animated.View style={{ opacity }} className="h-4 w-3/4 bg-gray-200 rounded" />
                <Animated.View style={{ opacity, marginTop: 8 }} className="h-3 w-full bg-gray-200 rounded" />
              </View>
              <View className="flex-row items-center gap-1.5 shrink-0 ml-2">
                <Animated.View style={{ opacity }} className="w-[20px] h-[20px] rounded-full bg-gray-200" />
                <Animated.View style={{ opacity }} className="w-[20px] h-[20px] rounded-full bg-gray-200" />
                <Animated.View style={{ opacity }} className="w-[20px] h-[20px] rounded-full bg-gray-200" />
              </View>
            </View>
            
            <View className="mt-auto pt-2 flex-row justify-between items-center w-full">
              <Animated.View style={{ opacity }} className="h-3 w-20 bg-gray-200 rounded" />
              <Animated.View style={{ opacity }} className="h-3 w-16 bg-gray-200 rounded" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
