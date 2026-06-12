import { fonts } from "@/constants/fonts";
import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle, StyleSheet } from "react-native";

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
    let finalStyleStr = styleStr;

    // Detect numeric heights/widths from the style string to handle small heights gracefully
    let detectedHeight: number | undefined;
    const hBracketsMatch = styleStr.match(/h-\[(\d+(?:\.\d+)?)(px)?\]/);
    if (hBracketsMatch) {
        detectedHeight = parseFloat(hBracketsMatch[1]);
    } else {
        const hTailwindMatch = styleStr.match(/h-(\d+)/);
        if (hTailwindMatch) {
            detectedHeight = parseInt(hTailwindMatch[1], 10) * 4;
        }
    }

    if (!detectedHeight) {
        const genericMatch = styleStr.match(/(?:^|\s)(?:height-|h-)?(\d+(?:\.\d+)?)(px)(?:\s|$)/);
        if (genericMatch) {
            detectedHeight = parseFloat(genericMatch[1]);
        }
    }

    let detectedWidth: number | string | undefined;
    const wBracketsMatch = styleStr.match(/w-\[(\d+(?:\.\d+)?)(px|%)?\]/);
    if (wBracketsMatch) {
        const val = wBracketsMatch[1];
        const unit = wBracketsMatch[2];
        if (unit === "px") {
            detectedWidth = parseFloat(val);
        } else if (unit === "%") {
            detectedWidth = `${val}%`;
        } else {
            detectedWidth = parseFloat(val);
        }
    }

    const isSmallCard = detectedHeight !== undefined && detectedHeight <= 100;

    let inlineHeightStyle: ViewStyle = {};
    if (detectedHeight) {
        inlineHeightStyle = { height: detectedHeight };
        // Remove h-[...] or h-... or generic px height classes from finalStyleStr so twrnc doesn't process it
        finalStyleStr = finalStyleStr
            .replace(/h-\[[^\]]+\]/g, "")
            .replace(/\bh-\d+\b/g, "")
            .replace(/\b(?:height-|h-)?\d+(?:\.\d+)?px\b/g, "");
    }

    let inlineWidthStyle: ViewStyle = {};
    if (detectedWidth !== undefined) {
        inlineWidthStyle = { width: detectedWidth };
        finalStyleStr = finalStyleStr.replace(/w-\[[^\]]+\]/g, "");
    }

    const hasWidth = styleStr.includes("w-[") || styleStr.includes("w-");
    const hasHeight = styleStr.includes("h-[") || styleStr.includes("h-");
    const hasRounded = styleStr.includes("rounded-");
    const hasMarginY = styleStr.includes("my-") || styleStr.includes("mt-") || styleStr.includes("mb-");
    const hasPadding = styleStr.includes("p-") || styleStr.includes("px-") || styleStr.includes("py-");

    if (isSmallCard) {
        // Remove raw paddings to let the card be responsive and fit inside the constrained height
        finalStyleStr = finalStyleStr
            .replace(/\bp-\d+(\.\d+)?\b/g, "")
            .replace(/\bpx-\d+(\.\d+)?\b/g, "")
            .replace(/\bpy-\d+(\.\d+)?\b/g, "");
    }

    const containerClasses = [
        !hasWidth && "w-[49%]",
        !hasHeight && "h-[45%]",
        !hasRounded && "rounded-lg",
        !hasMarginY && "my-1.5",
        isSmallCard ? "p-2.5" : (!hasPadding && "p-3"),
        "flex-row items-center shadow-sm",
        isActive ? "bg-[#282828]" : finalStyleStr
    ].filter(Boolean).join(" ");

    const combinedStyle = StyleSheet.flatten([
        inlineStyle,
        inlineHeightStyle,
        inlineWidthStyle
    ]);

    const iconContainerSizeClass = isSmallCard
        ? "w-[40px] h-[40px] rounded-xl items-center justify-center mr-2"
        : "w-[50px] h-[50px] rounded-2xl items-center justify-center mr-3";

    let renderedIcon = icon;
    if (isSmallCard && React.isValidElement(icon)) {
        const currentSize = (icon.props as any).size;
        if (currentSize && currentSize > 24) {
            renderedIcon = React.cloneElement(icon, { size: 24 } as any);
        }
    }

    const finalValueSize = valueSize || (isSmallCard ? "text-[14px]" : "text-base");
    const finalLabelSize = labelSize || (isSmallCard ? "text-[11px]" : "text-[13px]");

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={!isClickable}
            style={combinedStyle}
            className={containerClasses}
            activeOpacity={isClickable ? 0.7 : 1}
        >
            <View
                style={{ backgroundColor: iconBgColor }}
                className={iconContainerSizeClass}
            >
                {renderedIcon}
            </View>

            <View className="flex-1 justify-center">
                <View className="flex-row justify-between items-baseline">
                    <Text className={`${isActive ? "text-white" : "text-[#282828]"} ${finalValueSize}`} style={{ fontFamily: fonts.bold }}>
                        {value}
                    </Text>

                    {totalPercentage !== undefined && (
                        <Text style={{ color: iconBgColor, fontFamily: fonts.semiBold }} className="text-base">
                            {totalPercentage}
                        </Text>
                    )}
                </View>

                <Text className={`${isSmallCard ? "mt-0" : "mt-0.5"} ${isActive ? "text-white" : "text-[#515151]"} ${finalLabelSize}`} style={{ fontFamily: fonts.regular }}>
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
}