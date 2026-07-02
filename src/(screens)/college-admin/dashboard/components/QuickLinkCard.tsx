import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface QuickLinkCardProps {
    title: string;
    onClick: () => void;
}

export default function QuickLinkCard({ title, onClick }: QuickLinkCardProps) {
    const isPlacement = title === "Placement";
    const [gearRunning, setGearRunning] = useState(isPlacement);

    useEffect(() => {
        if (!isPlacement) return;
        const timer = setTimeout(() => {
            setGearRunning(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [isPlacement]);

    const disabled = isPlacement && !gearRunning;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                disabled && styles.disabledContainer,
            ]}
            onPress={!disabled ? onClick : undefined}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.viewText, disabled && styles.disabledViewText]}>
                View
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#E4F2E7",
        borderRadius: 8,
        padding: 16,
        height: 64,
        flexDirection: "column",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    disabledContainer: {
        opacity: 0.7,
    },
    title: {
        fontWeight: "600",
        color: "#1F2937",
        fontSize: 14,
    },
    viewText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#1F2937",
    },
    disabledViewText: {
        color: "#9CA3AF",
    },
});
