import { Text } from '@/components/AppText';
import React from 'react';
import { View } from 'react-native';

export default function PillTag({ label }: { label: string }) {
    return (
        <View className="bg-[#16284F1F] px-3 py-1 rounded-full mx-1 flex-row items-center justify-center">
            <Text className="text-xs font-normal text-[#16284F]">
                {label}
            </Text>
        </View>
    );
}
