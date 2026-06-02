import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import clsx from "clsx";
import { User } from "phosphor-react-native";

interface AvatarProps {
    src?: string | null;
    alt: string;
    size?: number;
    className?: string;
}

export const Avatar = ({
    src,
    alt,
    size = 56,
    className,
}: AvatarProps) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    const isValid =
        src &&
        !error &&
        (src.startsWith("http") ||
            src.startsWith("data:") ||
            src.startsWith("blob:"));

    const dynamicDimensions = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    if (!isValid) {
        return (
            <View
                style={dynamicDimensions}
                className={clsx(
                    "bg-gray-200 items-center justify-center border border-gray-200 overflow-hidden shrink-0",
                    className
                )}
            >
                <User
                    size={size * 0.5}
                    color="#9CA3AF"
                    weight="fill"
                />
            </View>
        );
    }

    return (
        <View
            style={dynamicDimensions}
            className={clsx(
                "relative overflow-hidden border border-gray-200 shrink-0 bg-gray-100",
                className
            )}
        >
            <Image
                source={{ uri: src }}
                accessibilityLabel={alt}
                style={StyleSheet.absoluteFillObject}
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setError(true)}
            />
        </View>
    );
};