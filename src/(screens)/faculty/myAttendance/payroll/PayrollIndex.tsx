import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity } from 'react-native';
import SummaryPage from "./components/SummaryPage";
import MyPayPage from "./components/MyPayPage";
import ManageTaxPage from "./components/ManageTaxPage";
import { fonts } from "@/constants/fonts";

export default function PayrollIndex() {
  const [activePayrollTab, setActivePayrollTab] = useState<"summary" | "myPay" | "manageTax">("summary");

  const payrollSubTabs = [
    { id: "summary", label: "Summary" },
    { id: "myPay", label: "My Pay" },
    { id: "manageTax", label: "Manage Tax" },
  ];

  return (
    <View className="flex-col items-center w-full max-md:px-0">
      <View className="flex-row justify-around mb-4 w-full">
        {payrollSubTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActivePayrollTab(tab.id as any)}
            className={`pb-1.5 border-b-[2px] ${
              activePayrollTab === tab.id ? "border-[#43C17A]" : "border-transparent"
            }`}
          >
            <Text
              className={`text-[13px] sm:text-[15px] ${
                activePayrollTab === tab.id ? "text-[#43C17A]" : "text-[#5A5A5A]"
              }`}
              style={{ fontFamily: activePayrollTab === tab.id ? fonts.bold : fonts.medium }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="w-full mt-2">
        {activePayrollTab === "summary" && <SummaryPage />}
        {activePayrollTab === "myPay" && <MyPayPage />}
        {activePayrollTab === "manageTax" && <ManageTaxPage />}
      </View>
    </View>
  );
}
