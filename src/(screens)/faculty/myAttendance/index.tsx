import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import AttendancePage from "./components/AttendancePage";
import AttendanceAnalyticsPage from "./components/AttendanceAnalyticsPage";
import PayrollIndex from "./payroll/PayrollIndex";
import { fonts } from "@/constants/fonts";
import { MotiView } from "moti";

type MainTab = "attendance" | "payroll" | "analytics";

export default function MyAttendanceScreen() {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("attendance");
  const [tabWidth, setTabWidth] = useState(0);

  const mainTabs = [
    { id: "attendance", label: t("Auto.Common.Attendance", "Attendance") },
    { id: "payroll", label: t("Auto.Common.Payroll", "Payroll") },
    { id: "analytics", label: t("Auto.Common.Analytics", "Analytics") },
  ];

  const getTranslateX = (tab: MainTab, width: number) => {
    if (tab === "attendance") return 0;
    if (tab === "payroll") return width;
    return width * 2;
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingTop: headerHeight + 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-center mb-6 w-full px-2">
          <View 
            className="flex-row bg-[#E5E5E5] p-1 rounded-full relative w-full items-center"
            onLayout={(e: LayoutChangeEvent) => {
              setTabWidth((e.nativeEvent.layout.width - 8) / 3);
            }}
          >
            {tabWidth > 0 && (
              <MotiView
                style={{ 
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: 4,
                  width: tabWidth,
                  backgroundColor: "#43C17A",
                  borderRadius: 9999,
                }}
                animate={{
                  translateX: getTranslateX(activeMainTab, tabWidth),
                }}
                transition={{ type: "spring", stiffness: 350, damping: 130 }}
              />
            )}
            
            {mainTabs.map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveMainTab(tab.id as MainTab)}
                  className="flex-1 py-2 px-1 items-center justify-center z-10"
                >
                  <Text
                    className={`text-[12px] sm:text-[14px] text-center`}
                    style={{ 
                        fontFamily: isActive ? fonts.bold : fonts.semiBold,
                        color: isActive ? "#FFFFFF" : "#5A5A5A"
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mt-2 w-full">
          {activeMainTab === "attendance" && <AttendancePage />}
          {activeMainTab === "payroll" && <PayrollIndex />}
          {activeMainTab === "analytics" && <AttendanceAnalyticsPage />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
