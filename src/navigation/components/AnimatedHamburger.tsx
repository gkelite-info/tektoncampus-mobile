import React from 'react';
import { TouchableOpacity, Platform, View } from 'react-native';

type Props = {
    onPress?: () => void;
};

export default function AnimatedHamburger({ onPress }: Props = {}) {
    return (
        <TouchableOpacity 
            onPress={() => {
                if (onPress) {
                    onPress();
                }
                if (Platform.OS === 'web') {
                    (document.activeElement as HTMLElement)?.blur();
                }
            }}
            className="w-11 h-11 justify-center items-center ml-2.5"
            activeOpacity={0.7}
        >
            <View className="w-6 h-[2.5px] bg-[#1E293B] rounded-[2px] my-[2.5px]" />
            <View className="w-6 h-[2.5px] bg-[#1E293B] rounded-[2px] my-[2.5px]" />
            <View className="w-6 h-[2.5px] bg-[#1E293B] rounded-[2px] my-[2.5px]" />
        </TouchableOpacity>
    );
}
