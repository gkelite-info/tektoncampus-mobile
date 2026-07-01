import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Icon } from "phosphor-react-native";

interface StatCardProps {
    label: string;
    value: string;
    backgroundColor: string;
    icon: React.ElementType;
    iconColor: string;
}

export default function StatCard({
    label,
    value,
    backgroundColor,
    icon: IconComponent,
    iconColor,
}: StatCardProps) {
    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.iconContainer}>
                <IconComponent size={20} weight="fill" color={iconColor} />
            </View>
            <View>
                <Text style={styles.valueText}>{value}</Text>
                <Text style={styles.labelText}>{label}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        padding: 16,
        flexDirection: "column",
        justifyContent: "space-between",
        height: 120,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        backgroundColor: "#FFFFFF",
        width: 32,
        height: 32,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    valueText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
    },
    labelText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#4B5563",
    },
});
