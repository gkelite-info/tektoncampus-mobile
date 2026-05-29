import { getStudentAcademicPerformance } from "@/lib/helpers/student/AcademicPerformance/calculations";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";

type AcademicPerformanceDatum = {
    subject: string;
    value: number;
    full: number;
};

interface AcademicPerformanceProps {
    studentId: number | null;
    data?: AcademicPerformanceDatum[];
    // Fallback localization strings if you don't map next-intl to a native alternate
    translations?: {
        calculating?: string;
        title?: string;
        failed?: string;
    };
}

export default function AcademicPerformance({
    studentId,
    data: externalData,
    translations,
}: AcademicPerformanceProps) {
    const [data, setData] = useState<AcademicPerformanceDatum[]>(externalData ?? []);
    const [loading, setLoading] = useState(!externalData);

    // Fallback defaults for i18n
    const tTitle = translations?.title || "Academic Performance";
    const tCalculating = translations?.calculating || "Calculating performance...";
    const tFailed = translations?.failed || "Failed to load performance";

    useEffect(() => {
        if (externalData) {
            setData(externalData);
            setLoading(false);
            return;
        }

        async function loadData() {
            try {
                const performance = await getStudentAcademicPerformance(studentId);
                setData(performance);
            } catch (err) {
                Alert.alert("Error", tFailed);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [studentId, externalData]);

    // Transform Recharts data structure format to match Gifted-Charts stacked requirements
    const chartData = data.map((item) => ({
        value: item.value,
        label: item.subject,
        frontColor: "#A8E089",
        gradientColor: "#9ACC7D",
        showGradient: true,
        // Setting up the background comparative visual ceiling (the 'full' bar equivalent)
        topLabelComponent: () => (
            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.value}%</Text>
            </View>
        ),
    }));

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#9ACC7D" />
                <Text style={styles.loaderText}>{tCalculating}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{tTitle}</Text>
            </View>

            <View style={styles.chartWrapper}>
                <BarChart
                    data={chartData}
                    barWidth={32}
                    spacing={24}
                    roundedTop
                    roundedBottom
                    noOfSections={4}
                    maxValue={100}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#ccc"
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.xAxisText}
                    yAxisLabelSuffix="%"
                    isAnimated
                    // Mimics your background ceiling layout block
                    showReferenceLine1
                    referenceLine1Position={100}
                    referenceLine1Config={{
                        color: "rgba(233, 245, 230, 0.4)",
                        dashWidth: 0,
                        thickness: 2,
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Android shadows box layer
    },
    loaderContainer: {
        height: 240,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
    },
    loaderText: {
        marginTop: 10,
        color: "#888888",
        fontSize: 14,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
        marginBottom: 25,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#282828",
    },
    chartWrapper: {
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 5,
    },
    yAxisText: {
        fontSize: 10,
        color: "#888888",
    },
    xAxisText: {
        fontSize: 9.5,
        color: "#282828",
        fontWeight: "600",
        textAlign: "center",
    },
    badgeContainer: {
        backgroundColor: "#E8F6E2",
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        marginBottom: 4,
        alignSelf: "center",
    },
    badgeText: {
        color: "#7CD24C",
        fontSize: 8,
        fontWeight: "bold",
    },
});