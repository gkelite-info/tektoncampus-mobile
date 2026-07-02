import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { AdminDetail } from "@/lib/helpers/collegeAdmin/Collegeadmindashboardapi";

interface AdminProfileCardProps {
    data: AdminDetail;
}

export default function AdminProfileCard({ data }: AdminProfileCardProps) {
    const handleEmailPress = () => {
        if (data.email) {
            Linking.openURL(`mailto:${data.email}`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.name} numberOfLines={1}>
                    {data.fullName}
                </Text>
                {data.isActive && (
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeText}>Active</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity onPress={handleEmailPress} style={styles.emailContainer}>
                <Text style={styles.email} numberOfLines={1}>
                    {data.email}
                </Text>
            </TouchableOpacity>

            <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Education Type :</Text>
                    <Text style={[styles.detailValue, styles.textBlue]}>{data.eduType}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Branches:</Text>
                    <Text style={styles.detailValue}>{data.branchCount}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mobile:</Text>
                    <Text style={styles.detailValue}>{data.mobile}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>{data.gender}</Text>
                </View>

                <View style={[styles.detailRow, styles.pt1]}>
                    <Text style={styles.detailLabel}>Date of Joining:</Text>
                    <Text style={[styles.detailValue, styles.textGray]}>
                        {data.dateOfJoining && data.dateOfJoining !== "—"
                            ? data.dateOfJoining
                            : "—"}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        width: 260,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    name: {
        fontWeight: "bold",
        color: "#1F2937",
        fontSize: 18,
        flex: 1,
        marginRight: 8,
    },
    activeBadge: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeText: {
        color: "#059669",
        fontSize: 10,
        fontWeight: "bold",
    },
    emailContainer: {
        marginBottom: 20,
    },
    email: {
        color: "#22C55E",
        fontSize: 12,
        fontWeight: "500",
    },
    detailsGrid: {
        gap: 8,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    pt1: {
        paddingTop: 4,
    },
    detailLabel: {
        color: "#4B5563",
        fontWeight: "500",
        fontSize: 13,
    },
    detailValue: {
        fontWeight: "bold",
        color: "#1F2937",
        fontSize: 13,
    },
    textBlue: {
        color: "#1E40AF",
    },
    textGray: {
        color: "#4B5563",
        fontWeight: "600",
    },
});
