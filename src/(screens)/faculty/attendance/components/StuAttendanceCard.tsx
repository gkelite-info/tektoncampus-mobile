import { Text } from '@/components/AppText';
import React from "react";
import { View } from 'react-native';
import { IconProps } from "phosphor-react-native";

export interface CardProps {
  value: string;
  label: string;
  bgColor: string;
  icon: React.ReactElement<IconProps>;
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
  const styledIcon = React.cloneElement(icon, {
    color: iconColor,
    weight: "fill",
    size: 20
  } as IconProps);

  return (
    <View
      className={`rounded-xl px-4 py-3 flex-row items-center justify-start h-[80px] w-full ${bgColor}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View
        className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center mr-3 ${iconBgColor}`}
      >
        {styledIcon}
      </View>

      <View className="flex-col justify-center flex-1">
        <Text className="text-[17px] font-bold text-gray-900 leading-tight mb-0.5">
          {value}
        </Text>
        <Text 
          className="text-[11px] font-medium text-gray-700 leading-tight"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
