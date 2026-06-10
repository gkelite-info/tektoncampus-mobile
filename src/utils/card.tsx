import { fonts } from "@/constants/fonts";
import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";

type CardProps = {
    style?: string;
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
    valueSize?: string;
    labelSize?: string;
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
    valueSize,
    labelSize,
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

    const styleStr = style || "";
    const hasWidth = styleStr.includes("w-[") || styleStr.includes("w-");
    const hasHeight = styleStr.includes("h-[") || styleStr.includes("h-");
    const hasRounded = styleStr.includes("rounded-");
    const hasMarginY = styleStr.includes("my-") || styleStr.includes("mt-") || styleStr.includes("mb-");

    const containerClasses = [
        !hasWidth && "w-[49%]",
        !hasHeight && "h-[45%]",
        !hasRounded && "rounded-lg",
        !hasMarginY && "my-1.5",
        "p-3 flex-row items-center shadow-sm",
        isActive ? "bg-[#282828]" : styleStr
    ].filter(Boolean).join(" ");

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={!isClickable}
            style={inlineStyle}
            className={containerClasses}
            activeOpacity={isClickable ? 0.7 : 1}
        >
            <View
                style={{ backgroundColor: iconBgColor }}
                className="w-[50px] h-[50px] rounded-2xl items-center justify-center mr-3"
            >
                {icon}
            </View>

            <View className="flex-1 justify-center">
                <View className="flex-row justify-between items-baseline">
                    <Text className={`${isActive ? "text-white" : "text-[#282828]"} ${valueSize || "text-[22px]"}`} style={{ fontFamily: fonts.bold }}>
                        {value}
                    </Text>

                    {totalPercentage !== undefined && (
                        <Text style={{ color: iconBgColor, fontFamily: fonts.semiBold }} className="text-base">
                            {totalPercentage}
                        </Text>
                    )}
                </View>

                <Text className={`mt-0.5 ${isActive ? "text-white" : "text-[#515151]"} ${labelSize || "text-[13px]"}`} style={{ fontFamily: fonts.regular }}>
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
}