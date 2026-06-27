import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "@/components/AppText";
import { ChevronRight } from "lucide-react-native";
import { getStudentAcademicPerformance } from "@/lib/helpers/student/AcademicPerformance/calculations";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BarChart } from "react-native-gifted-charts";

export default function AcademicPerformanceSmall({
  studentId,
}: {
  studentId: number | null;
}) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (studentId) {
          const performance = await getStudentAcademicPerformance(studentId);
          setData(performance);
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: t("Dashboard.parent.Failed to load performance", "Failed to load performance"),
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color="#604DDC" />
        <Text style={styles.loadingText}>
          {t("Dashboard.parent.Calculating performance", "Calculating performance...")}
        </Text>
      </View>
    );
  }

  const chartData = data.map((item) => ({
    value: item.value,
    label: item.subject,
    frontColor: "#A8E089",
    topLabelComponent: () => (
      <View style={styles.topLabelContainer}>
        <Text style={styles.topLabelText}>{item.value}%</Text>
      </View>
    ),
  }));

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 48; // padding

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("Dashboard.parent.Academic Performance", "Academic Performance")}
        </Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("StudentProgress")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            barWidth={25}
            spacing={chartData.length > 3 ? 15 : 40}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: "#888", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#888", fontSize: 10, textAlign: "center" }}
            noOfSections={4}
            maxValue={100}
            showFractionalValues={false}
            height={130}
            width={chartWidth - 40}
            isAnimated
          />
        ) : (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No Data</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    height: 220,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    marginTop: 16,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    fontSize: 12,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#282828",
  },
  chartContainer: {
    flex: 1,
    alignItems: "center",
  },
  noData: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#8E8E93",
    fontSize: 12,
  },
  topLabelContainer: {
    backgroundColor: "#E8F6E2",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 4,
  },
  topLabelText: {
    color: "#7CD24C",
    fontSize: 8,
    fontWeight: "bold",
  },
});
