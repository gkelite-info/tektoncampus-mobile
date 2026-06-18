import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Calendar, FileText, CheckCircle, Clock, WarningCircle } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function LeaveRequestsScreen() {const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const [showForm, setShowForm] = useState(false);


  const balances = [
  { type: "Sick Leave", count: 4, color: "#EF4444" },
  { type: "Casual Leave", count: 6, color: "#3B82F6" },
  { type: "Duty Leave", count: 2, color: "#10B981" }];


  const history = [
  {
    type: "Sick Leave",
    duration: "June 2 - June 3 (2 Days)",
    reason: "Suffering from high fever and cold",
    status: "Approved",
    color: "emerald"
  },
  {
    type: "Casual Leave",
    duration: "May 15 (1 Day)",
    reason: "Attending sister's wedding ceremony",
    status: "Approved",
    color: "emerald"
  },
  {
    type: "Casual Leave",
    duration: "June 18 (1 Day)",
    reason: "Personal family emergency",
    status: "Pending",
    color: "amber"
  }];


  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
            <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: headerHeight + 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        
                {}
                <View className="mb-6">
                    <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.LeaveRequests", "Leave Requests")}

          </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Applyforleavesa", "Apply for leaves and track approval history")}

          </Text>
                </View>

                {}
                <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
                    {balances.map((bal, idx) =>
          <View key={idx} className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center">
                            <Text className="text-[20px] text-[#1E293B]" style={{ fontFamily: fonts.bold }}>
                                {bal.count}
                            </Text>
                            <Text className="text-slate-400 text-[10px] text-center mt-1" style={{ fontFamily: fonts.regular }}>
                                {bal.type}
                            </Text>
                            <View
              className="w-1.5 h-1.5 rounded-full mt-2"
              style={{ backgroundColor: bal.color }} />
            
                        </View>
          )}
                </View>

                {}
                {showForm ?
        <View className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 mb-6">
                        <Text className="text-[#1E293B] text-[15px] mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.NewLeaveApplica", "New Leave Application")}

          </Text>
                        
                        {}
                        <Text className="text-slate-500 text-xs mb-1.5" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.LeaveType", "Leave Type")}</Text>
                        <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-3">
                            <Text className="text-slate-700 text-xs" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.SickLeave", "Sick Leave")}</Text>
                        </View>

                        <Text className="text-slate-500 text-xs mb-1.5" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Reason", "Reason")}</Text>
                        <TextInput
            placeholder={t("Auto.Attr.Enterdetailedre", "Enter detailed reason here...")}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 mb-4 h-20"
            style={{ textAlignVertical: "top", fontFamily: fonts.regular }}
            multiline />
          

                        <View className="flex-row justify-end" style={{ gap: 8 }}>
                            <TouchableOpacity
              onPress={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 rounded-xl">
              
                                <Text className="text-slate-600 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Cancel", "Cancel")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
              onPress={() => setShowForm(false)}
              className="px-4 py-2 bg-[#43C17A] rounded-xl">
              
                                <Text className="text-white text-xs font-bold" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Submit", "Submit")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View> :

        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl items-center mb-6">
          
                        <Text className="text-emerald-700 text-sm font-semibold" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ApplyforLeave", "+ Apply for Leave")}

          </Text>
                    </TouchableOpacity>
        }

                {}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-3" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ApplicationHist", "Application History")}

          </Text>

                    {history.map((item, idx) => {
            const icon = item.color === "emerald" ?
            <CheckCircle size={18} color="#10B981" /> :

            <Clock size={18} color="#F59E0B" />;


            const statusStyle = item.color === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";

            return (
              <View key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3">
                                <View className="flex-row justify-between items-center mb-2">
                                    <View className="flex-row items-center">
                                        <Text className="text-slate-700 text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                                            {item.type}
                                        </Text>
                                    </View>
                                    <View className={`px-2 py-0.5 rounded-md ${statusStyle.split(" ")[0]}`}>
                                        <Text className={`text-[9px] font-bold ${statusStyle.split(" ")[1]}`} style={{ fontFamily: fonts.bold }}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-slate-500 text-xs mb-1" style={{ fontFamily: fonts.medium }}>
                                    {item.duration}
                                </Text>
                                <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Reason", "Reason:")}
                  {item.reason}
                                </Text>
                            </View>);

          })}
                </View>
            </ScrollView>
        </SafeAreaView>);

}