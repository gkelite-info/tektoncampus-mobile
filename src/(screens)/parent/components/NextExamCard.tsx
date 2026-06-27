import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/AppText";
import { BookOpen, Calendar } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type NextExamProps = {
  date: string;
  subject: string;
};

export default function NextExamCard({ date, subject }: NextExamProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <BookOpen size={18} color="#E6BD71" />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {t("Dashboard.parent.Next Exam Date", "Next Exam Date")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.innerBox}>
          <View style={styles.calendarIconContainer}>
            <Calendar size={18} color="#fff" />
          </View>
          <Text style={styles.dateText} numberOfLines={1}>
            {t("Dashboard.parent.Date :", "Date :")}{" "}
            <Text style={styles.dateValue}>{date || t("Dashboard.parent.NA", "N/A")}</Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.subjectText} numberOfLines={1}>
            {t("Dashboard.parent.Subject -", "Subject -")}{" "}
            <Text style={styles.subjectValue}>{subject || t("Dashboard.parent.NA", "N/A")}</Text>
          </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
  iconContainer: {
    backgroundColor: "#F9EFDE",
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  innerBox: {
    backgroundColor: "#EBF6E4",
    width: "80%",
    borderRadius: 8,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderColor: "rgba(162, 216, 132, 0.2)",
    borderWidth: 1,
    marginBottom: 12,
  },
  calendarIconContainer: {
    backgroundColor: "#A2D884",
    borderRadius: 18,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dateText: {
    color: "#16284F",
    fontWeight: "500",
    fontSize: 12,
    textAlign: "center",
  },
  dateValue: {
    color: "#A2D884",
    fontWeight: "600",
  },
  footer: {
    width: "100%",
    alignItems: "center",
  },
  subjectText: {
    color: "#16284F",
    fontWeight: "500",
    fontSize: 12,
  },
  subjectValue: {
    color: "#604DDC",
    fontWeight: "600",
  },
});
