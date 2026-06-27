import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/AppText";
import { Calendar } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BarChart } from "react-native-gifted-charts";

type ChartProps = {
  month: string;
  value: number;
};

type AttendanceProp = {
  percentage: number;
  data?: ChartProps[];
};

export default function AttendanceCard({ percentage, data }: AttendanceProp) {
  const { t } = useTranslation();

  const chartData = data?.map((item) => ({
    value: item.value,
    label: item.month,
    frontColor: "#A2D884",
  })) || [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Calendar size={18} color="#604DDC" />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {t("Dashboard.parent.Attendance", "Attendance")}
          </Text>
        </View>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            barWidth={18}
            spacing={Dimensions.get("window").width < 400 ? 12 : 20}
            hideRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
            height={100}
            initialSpacing={10}
            isAnimated
            rulesColor="transparent"
            xAxisLabelTextStyle={{ color: "#8E8E93", fontSize: 10 }}
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
    height: 180,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 36,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    backgroundColor: "#EAECFC",
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#282828",
    flex: 1,
  },
  percentageContainer: {
    backgroundColor: "#E9E7FA",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  percentageText: {
    color: "#604DDC",
    fontSize: 12,
    fontWeight: "700",
  },
  chartContainer: {
    flex: 1,
    marginTop: 10,
    justifyContent: "flex-end",
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
});
