import React, { useEffect, useRef } from "react";
import { Animated, ViewProps, DimensionValue, ViewStyle } from "react-native";

interface SkeletonProps extends ViewProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular";
    width?: DimensionValue;
    height?: DimensionValue;
}

export default function Skeleton({
    className = "",
    variant = "rectangular",
    width,
    height,
    style,
    ...props
}: SkeletonProps) {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    const variants = {
        text: "rounded h-4 w-full",
        circular: "rounded-full",
        rectangular: "rounded-lg",
    };

    const classes = `bg-gray-200 ${variants[variant]} ${className}`;

    const inlineStyles: ViewStyle = {
        width: width,
        height: height,
    };

    return (
        <Animated.View
            style={[
                { opacity: pulseAnim },
                inlineStyles,
                style,
            ]}
            className={classes}
            {...props}
        />
    );
}