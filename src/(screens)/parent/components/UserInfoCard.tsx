import React from "react";
import { View, Image, StyleSheet, ImageBackground } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";

export type UserInfoCardProps = {
  show?: boolean;
  studentId?: number | string;
  studentBranch?: string;
  user: string;
  studentName?: string;
  facultySubject?: string;
  studentsTaskPercentage?: number;
  childPerformance?: string;
  image?: any;
  studentAcademicYear?: string;
};

type Props = {
  cardProps: UserInfoCardProps[];
};

export function UserInfoCard({ cardProps }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.bannerWrapper}>
        <Image 
          source={require("../../../../assets/dashboard-banner-bg.png")} 
          style={styles.bannerGraphic}
          resizeMode="stretch"
        />
      </View>
      {cardProps.map((item, index) => (
        <View key={index} style={styles.content}>
          <View style={styles.textContainer}>
            {item.show && (
              <Text style={styles.studentInfoText} numberOfLines={1}>
                {t("Dashboard.parent.StudentID:", "StudentID:")} {item.studentId},{" "}
                {item.studentBranch}, {item.studentAcademicYear}
              </Text>
            )}

            <Text style={styles.welcomeText}>
              {t("Dashboard.parent.Welcome Back,", "Welcome Back,")}
            </Text>

            <Text style={styles.nameRow}>
              <Text style={styles.userName}>
                {!item.show ? `${t("Dashboard.parent.Prof", "Prof.")} ${item.user}` : item.user}
              </Text>

              {item.show && item.studentName && (
                <Text style={styles.parentOfText}>
                  {"  "}{t("Dashboard.parent.Parent of", "Parent of")}{" "}
                  <Text style={styles.studentNameHighlight}>
                    {item.studentName}
                  </Text>
                </Text>
              )}
            </Text>

            {item.show && (
              <Text style={styles.performanceText}>
                {item.childPerformance}
              </Text>
            )}
          </View>

          {item.image && (
            <View style={styles.imageContainer}>
              <Image
                source={typeof item.image === "string" ? { uri: item.image } : item.image}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 160,
    backgroundColor: "#E6F4ED",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  bannerWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerGraphic: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 1, 
    opacity: 1,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    width: "70%",
    justifyContent: "center",
    zIndex: 10,
  },
  studentInfoText: {
    fontSize: 10,
    color: "#282828",
    opacity: 0.8,
    fontWeight: "500",
  },
  welcomeText: {
    fontSize: 14,
    color: "#282828",
    marginTop: 10,
  },
  nameRow: {
    marginTop: 2,
    lineHeight: 22,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#089144",
  },
  parentOfText: {
    fontSize: 11,
    color: "#454545",
    fontStyle: "italic",
    marginLeft: 4,
  },
  studentNameHighlight: {
    color: "#089144",
    fontWeight: "bold",
  },
  performanceText: {
    fontSize: 10,
    color: "#454545",
    marginTop: 8,
    lineHeight: 14,
    paddingRight: 10,
  },
  imageContainer: {
    width: 140, 
    height: "100%", 
    justifyContent: "flex-end",
    alignItems: "flex-end",
    position: "absolute",
    right: 0, 
    bottom: 0,
    zIndex: 5,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
