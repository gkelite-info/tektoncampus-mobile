import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useHeaderHeight } from "@react-navigation/elements";
import { useParent } from "@/providers/ParentProvider";
import { useUser } from "@/utils/context/UserContext";
import { getParentDashboardWidgets } from "@/lib/helpers/parent/dashboard/parentDashboardActions";

// Components
import { UserInfoCard } from "./components/UserInfoCard";
import AttendanceCard from "./components/AttendanceCard";
import AssignMentCard from "./components/AssignMentCard";
import NextExamCard from "./components/NextExamCard";
import AcademicPerformanceSmall from "./components/AcademicPerformanceSmall";
import FeeDueCard from "./components/FeeDueCard";
import FacultyChat from "./components/FacultyChat";
import SubjectProgressCards from "../faculty/utils/subjectProgressCard/subjectProgressCards";

export default function ParentHomeScreen() {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const { studentId, loading: parentLoading } = useParent();
  const { userId, fullName, gender } = useUser();

  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parentImage =
    gender === "Male"
      ? require("../../../assets/male-parent1.png")
      : require("../../../assets/female-parent.png");

  const loadWidgets = async () => {
    if (!userId) return;
    try {
      const data = await getParentDashboardWidgets(userId);
      setDashData(data);
    } catch (error) {
      console.error("Failed to load dashboard widgets", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWidgets();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWidgets();
  };

  if (loading || parentLoading) {
    return (
      <View style={[styles.center, { paddingTop: headerHeight + 16 }]}>
        <ActivityIndicator size="large" color="#604DDC" />
      </View>
    );
  }

  const card = [
    {
      show: true,
      studentId: dashData?.studentPin || 0,
      studentBranch: dashData?.branchName || t("Dashboard.parent.Loading", "Loading..."),
      studentAcademicYear: dashData?.academicYear || t("Dashboard.parent.Loading", "Loading..."),
      user: fullName || t("Dashboard.parent.User", "User"),
      studentName: dashData?.studentName || t("Dashboard.parent.Loading", "Loading..."),
      childPerformance: t(
        "Dashboard.parent.Your childs academic performance and attendance summary are available below",
        "Your child's academic performance and attendance summary are available below."
      ),
      image: parentImage,
    },
  ];

  const attendanceChartData = dashData?.attendanceChartData || [];

  const nextExam = {
    date: "21/Dec/2025",
    subject: "Computer Networks",
  };

  const chats = [
    { professor: "1", subject: "N/A" },
    { professor: "2", subject: "N/A" },
    { professor: "3", subject: "N/A" },
    { professor: "4", subject: "N/A" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: headerHeight + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <UserInfoCard cardProps={card} />

      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItemLeft}>
            <AttendanceCard
              percentage={dashData?.attendancePercentage || 0}
              data={attendanceChartData}
            />
          </View>
          <View style={styles.gridItemRight}>
            <AssignMentCard />
          </View>
        </View>

        <View style={[styles.gridRow, styles.gridRowSpacing]}>
          <View style={styles.gridItemLeft}>
            <NextExamCard date={nextExam.date} subject={nextExam.subject} />
          </View>
          <View style={styles.gridItemRight}>
            <FeeDueCard
              totalFee={dashData?.feeTotal || "0"}
              feePaid={dashData?.feePaid || "0"}
            />
          </View>
        </View>
      </View>

      <AcademicPerformanceSmall studentId={studentId} />

      <View style={{ marginTop: 16 }}>
        <SubjectProgressCards
          props={dashData?.subjects || []}
          isLoading={false}
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <FacultyChat props={chats} />
      </View>
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6", // Or match your background color
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: {
    marginTop: 16,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridRowSpacing: {
    marginTop: 16,
  },
  gridItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  gridItemRight: {
    flex: 1,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100, // Increased to avoid clipping under the bottom tab bar
  },
});