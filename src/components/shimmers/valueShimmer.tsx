import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export function ValueShimmer() {
    const shimmerAnimatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnimatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnimatedValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [shimmerAnimatedValue]);

    const translateX = shimmerAnimatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-64, 64],
    });

    return (
        <View className="w-16 h-6 bg-gray-100 rounded-md overflow-hidden relative justify-center">

            <Animated.View
                style={[
                    styles.shimmerLine,
                    {
                        transform: [{ translateX }],
                    },
                ]}
                className="absolute top-0 bottom-0 w-8 bg-gray-200/60 opacity-60"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    shimmerLine: {
        transform: [{ skewX: "-20deg" }],
    },
});