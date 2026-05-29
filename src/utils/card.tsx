import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";

type CardProps = {
    style?: string; // Accept tailwind class strings directly now!
    inlineStyle?: ViewStyle;
    isActive?: boolean;
    textSize?: string;
    icon: ReactNode;
    value: ReactNode;
    label: string;
    iconBgColor?: string;
    iconColor?: string;
    totalPercentage?: string | number;
    navigation?: any;
    to?: string;
    onClick?: () => void;
};

export default function CardComponent({
    style = "bg-white",
    inlineStyle,
    isActive = false,
    textSize = "text-[15px]",
    icon,
    value,
    label,
    to,
    navigation,
    iconBgColor = "#FFFFFF",
    iconColor = "#000000",
    totalPercentage,
    onClick,
}: CardProps) {

    const handlePress = () => {
        if (onClick) {
            onClick();
            return;
        }
        if (to && navigation) {
            navigation.navigate(to);
        }
    };

    const isClickable = !!onClick || !!to;

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={!isClickable}
            activeOpacity={0.8}
            style={inlineStyle}
            className={`w-[49%] h-[45%] rounded-lg p-3 flex-row items-center my-1.5 shadow-sm
        ${isActive ? "bg-[#282828]" : style} 
        ${isClickable ? "active:opacity-70" : ""}`}
        >
            <View
                style={{ backgroundColor: iconBgColor }}
                className="w-[50px] h-[50px] rounded-md items-center justify-center mr-3"
            >
                {icon}
            </View>

            <View className="flex-1 justify-center">
                <View className="flex-row justify-between items-baseline">
                    <Text className={`font-bold ${isActive ? "text-white" : "text-[#282828]"} ${textSize}`}>
                        {value}
                    </Text>

                    {totalPercentage !== undefined && (
                        <Text style={{ color: iconBgColor }} className="text-base font-semibold">
                            {totalPercentage}
                        </Text>
                    )}
                </View>

                <Text className={`text-base mt-0.5 ${isActive ? "text-white" : "text-[#515151]"} ${textSize}`}>
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
}