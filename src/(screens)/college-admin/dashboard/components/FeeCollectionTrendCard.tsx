import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import {
    FeeCollectionTrend,
    formatINR,
} from "@/lib/helpers/collegeAdmin/Feecollectiontrendapi";

const SEGMENT_COLORS = [
    "#7C3AED",
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
];

interface FeeCollectionTrendCardProps {
    trend: FeeCollectionTrend | null;
}

export default function FeeCollectionTrendCard({
    trend,
}: FeeCollectionTrendCardProps) {
    const segments = (trend?.segments ?? []).map((seg, i) => ({
        label: seg.eduType,
        value: formatINR(seg.collected),
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        amount: seg.collected,
    }));

    const total = segments.reduce((s, seg) => s + seg.amount, 0) || 1;
    const cx = 70,
        cy = 70,
        r = 52,
        gap = 0.04;

    let startAngle = -Math.PI / 2;
    const arcs = segments.map((seg) => {
        const angle = (seg.amount / total) * 2 * Math.PI - gap;
        const endAngle = startAngle + Math.max(angle, 0); // avoid negative angle if amount is 0
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
        startAngle = endAngle + gap;
        return { ...seg, d };
    });

    const centreLabel = trend ? formatINR(trend.grandTotal) : "—";

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fee Collection Trend</Text>

            <View style={styles.chartContainer}>
                <View style={styles.chartWrapper}>
                    <Svg width="150" height="150" viewBox="0 0 140 140">
                        {arcs.length > 0 ? (
                            arcs.map((arc, i) => (
                                <Path
                                    key={i}
                                    d={arc.d}
                                    stroke={arc.color}
                                    strokeWidth="14"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            ))
                        ) : (
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={r}
                                stroke="#E5E7EB"
                                strokeWidth="14"
                                fill="none"
                            />
                        )}
                    </Svg>
                    <View style={styles.centreLabelContainer}>
                        <Text style={styles.centreLabelText}>{centreLabel}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.legendContainer}>
                {arcs.length > 0 ? (
                    arcs.map((seg, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View
                                style={[
                                    styles.legendDot,
                                    { backgroundColor: seg.color },
                                ]}
                            />
                            <View>
                                <Text style={styles.legendLabel}>{seg.label}</Text>
                                <Text
                                    style={[
                                        styles.legendValue,
                                        { color: seg.color },
                                    ]}
                                >
                                    {seg.value}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>No collection data yet</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        padding: 20,
        flexDirection: "column",
        gap: 12,
    },
    title: {
        fontWeight: "bold",
        color: "#1F2937",
        fontSize: 14,
    },
    chartContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    chartWrapper: {
        position: "relative",
    },
    centreLabelContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    centreLabelText: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#1F2937",
    },
    legendContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 24,
        rowGap: 8,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendLabel: {
        color: "#6B7280",
        fontWeight: "500",
        fontSize: 12,
        lineHeight: 14,
    },
    legendValue: {
        fontWeight: "bold",
        fontSize: 12,
        lineHeight: 14,
    },
    noDataText: {
        color: "#9CA3AF",
        fontSize: 12,
    },
});
