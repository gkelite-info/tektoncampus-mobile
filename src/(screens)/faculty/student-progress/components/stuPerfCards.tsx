import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React from "react";
import { View } from 'react-native';
import tw from "twrnc";

export interface CardProps {
  value: React.ReactNode | string;
  label: string;
  bgColor: string;
  icon: React.ReactElement;
  iconBgColor: string;
  iconColor?: string; 
}

export default function CardComponent({
  value,
  label,
  bgColor,
  icon,
  iconBgColor,
  iconColor,
}: CardProps) {
  return (
    <View style={tw`rounded-xl shadow-sm p-3 md:p-4 flex-col justify-between h-[105px] md:h-[130px] w-full ${bgColor}`}>
      {/* Icon Box */}
      <View
        style={tw`w-8 h-8 md:w-10 md:h-10 rounded-lg items-center justify-center ${iconBgColor}`}
      >
        {icon}
      </View>

      {/* Text Area */}
      <View style={tw`mt-auto`}>
        <Text style={[{ fontFamily: fonts.bold }, tw`text-[18px] md:text-3xl  text-gray-900 leading-none`]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[{ fontFamily: fonts.medium }, tw`text-[10px] md:text-sm  text-gray-600 mt-1`]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}
