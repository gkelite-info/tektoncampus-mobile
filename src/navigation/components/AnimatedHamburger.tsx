import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, SharedValue } from 'react-native-reanimated';
import { useDrawerProgress } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export default function AnimatedHamburger() {
    const progress = useDrawerProgress() as SharedValue<number>;
    const navigation = useNavigation<DrawerNavigationProp<any>>();

    const topStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [0, 7.5], Extrapolation.CLAMP);
        const rotate = interpolate(progress.value, [0, 1], [0, 45], Extrapolation.CLAMP);
        return {
            transform: [{ translateY }, { rotate: `${rotate}deg` }],
        };
    });

    const middleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [0, 0.5, 1], [1, 0, 0], Extrapolation.CLAMP);
        const scale = interpolate(progress.value, [0, 0.5, 1], [1, 0.5, 0], Extrapolation.CLAMP);
        return { 
            opacity,
            transform: [{ scale }]
        };
    });

    const bottomStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [0, -7.5], Extrapolation.CLAMP);
        const rotate = interpolate(progress.value, [0, 1], [0, -45], Extrapolation.CLAMP);
        return {
            transform: [{ translateY }, { rotate: `${rotate}deg` }],
        };
    });

    return (
        <TouchableOpacity 
            onPress={() => navigation.toggleDrawer()}
            className="w-11 h-11 justify-center items-center ml-2.5"
            activeOpacity={0.7}
        >
            <Animated.View className="w-6 h-[2.5px] bg-[#1E293B] rounded-[2px] my-[2.5px]" style={topStyle} />
            <Animated.View className="w-6 h-[2.5px] bg-[#1E293B] rounded-[2px] my-[2.5px]" style={middleStyle} />
            <Animated.View className="w-6 h-[2.5px] bg-[#1E293B] rounded-[2px] my-[2.5px]" style={bottomStyle} />
        </TouchableOpacity>
    );
}
