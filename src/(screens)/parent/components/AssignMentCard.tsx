import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "@/components/AppText";
import { Clipboard } from "lucide-react-native";
import { useParent } from "@/providers/ParentProvider";
import { fetchChildAssignmentStats } from "@/lib/helpers/parent/dashboard/fetchChildAssignments";
import { useTranslation } from "react-i18next";

type AssignmentProps = {
  completed: number;
  total: number;
  nextDate: string;
};

export default function AssignMentCard() {
  const { childUserId, loading: parentLoading } = useParent();
  const { t } = useTranslation();

  const [stats, setStats] = useState<AssignmentProps>({
    completed: 0,
    total: 0,
    nextDate: "N/A",
  });
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (childUserId) {
        const data = await fetchChildAssignmentStats(childUserId);
        setStats(data);
      }
      setIsFetching(false);
    }
    if (!parentLoading) {
      loadStats();
    }
  }, [childUserId, parentLoading]);

  if (parentLoading || isFetching) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color="#604DDC" />
      </View>
    );
  }

  const percentage =
    stats.total > 0
      ? Math.min(Math.round((stats.completed / stats.total) * 100), 100)
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Clipboard size={18} color="#6ECC90" />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {t("Dashboard.parent.Assignments", "Assignments")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>
              {stats.completed}/{stats.total}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.dateText} numberOfLines={1}>
            {t("Dashboard.parent.Next Date:", "Next Date:")}{" "}
            <Text style={styles.dateValue}>{stats.nextDate}</Text>
          </Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${percentage}%` }]}
            />
          </View>
        </View>
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
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
  iconContainer: {
    backgroundColor: "#E1F4E8",
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
  content: {
    flex: 1,
  },
  circleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    backgroundColor: "#E6E3FF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    color: "#604DDC",
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    height: 40,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  dateText: {
    color: "#16284F",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 6,
  },
  dateValue: {
    color: "#604DDC",
  },
  progressBarBackground: {
    backgroundColor: "#DDDDDD",
    height: 12,
    borderRadius: 6,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    backgroundColor: "#A2D884",
    height: "100%",
    borderRadius: 6,
  },
});
