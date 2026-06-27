import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { MessageCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react-native";

type SubjectProgressCard = {
  image?: string;
  professor: string;
  subject: string;
};

type SubjectProgressCardProps = {
  props: SubjectProgressCard[];
};

const DefaultAvatarSmall = () => (
  <View style={styles.defaultAvatarContainer}>
    <User size={20} color="#9CA3AF" />
  </View>
);

export default function FacultyChat({ props }: SubjectProgressCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("Dashboard.parent.Faculty Chat", "Faculty Chat")}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollContent}
      >
        {props.map((item, index) => (
          <View style={styles.chatRow} key={index}>
            <View style={styles.avatarContainer}>
              <DefaultAvatarSmall />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.professorText} numberOfLines={1}>
                {t("Dashboard.parent.Prof", "Prof.")} {item.professor}
              </Text>
              <Text style={styles.subjectText} numberOfLines={1}>
                {item.subject}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.chatIconContainer}
              activeOpacity={0.7}
            >
              <MessageCircle size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    height: 280,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#282828",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  chatRow: {
    backgroundColor: "#E8F6E2",
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  professorText: {
    color: "#282828",
    fontWeight: "500",
    fontSize: 13,
  },
  subjectText: {
    color: "#282828",
    fontSize: 10,
    opacity: 0.8,
  },
  chatIconContainer: {
    backgroundColor: "#A1D683",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
