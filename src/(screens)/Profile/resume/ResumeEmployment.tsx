import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import {
  getEmployment,
  addEmployment,
  updateEmployment,
  deleteEmployment } from
"../../../lib/helpers/resume/employmentAPI";

function EmploymentFormItem({ item, studentId, onSaved, onDelete }: any) {const { t } = useTranslation();
  const [companyName, setCompanyName] = useState(item.companyName || "");
  const [designation, setDesignation] = useState(item.designation || "");
  const [experienceYears, setExperienceYears] = useState(item.experienceYears?.toString() || "0");
  const [experienceMonths, setExperienceMonths] = useState(item.experienceMonths?.toString() || "0");
  const [startDate, setStartDate] = useState(item.startDate || "");
  const [endDate, setEndDate] = useState(item.endDate || "");
  const [description, setDescription] = useState(item.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!companyName.trim() || !designation.trim() || !startDate.trim()) {
      Toast.show({ type: "error", text1: "Company, Designation, and Start Date are required" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        studentId,
        companyName: companyName.trim(),
        designation: designation.trim(),
        experienceYears: parseInt(experienceYears, 10) || 0,
        experienceMonths: parseInt(experienceMonths, 10) || 0,
        startDate,
        endDate: endDate ? endDate : null,
        description: description.trim(),
        updatedAt: new Date().toISOString()
      };

      if (item.employmentId) {
        await updateEmployment(item.employmentId, payload);
        Toast.show({ type: "success", text1: "Employment updated" });
      } else {
        await addEmployment({ ...payload, createdAt: new Date().toISOString() });
        Toast.show({ type: "success", text1: "Employment added" });
      }
      onSaved();
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to save employment" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete", "Are you sure you want to delete this?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete", style: "destructive",
      onPress: async () => {
        if (item.employmentId) {
          setIsLoading(true);
          try {
            await deleteEmployment(item.employmentId);
            Toast.show({ type: "success", text1: "Deleted successfully" });
            onDelete();
          } catch (e) {
            Toast.show({ type: "error", text1: "Failed to delete" });
          } finally {
            setIsLoading(false);
          }
        } else {
          onDelete();
        }
      }
    }]
    );
  };

  return (
    <View className="border border-gray-200 rounded-xl p-4 bg-white mb-4 ">
            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.CompanyName", "Company Name *")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgGoogle", "E.g. Google")}
        value={companyName}
        onChangeText={setCompanyName} />
      

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Designation", "Designation *")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgSoftwareEngin", "E.g. Software Engineer")}
        value={designation}
        onChangeText={setDesignation} />
      

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ExpYears", "Exp (Years)")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            keyboardType="numeric"
            value={experienceYears}
            onChangeText={setExperienceYears} />
          
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ExpMonths", "Exp (Months)")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            keyboardType="numeric"
            value={experienceMonths}
            onChangeText={setExperienceMonths} />
          
                </View>
            </View>

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.StartDate", "Start Date *")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.YYYYMMDD", "YYYY-MM-DD")}
            value={startDate}
            onChangeText={setStartDate} />
          
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.EndDate", "End Date")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.YYYYMMDDLeaveem", "YYYY-MM-DD (Leave empty if current)")}
            value={endDate}
            onChangeText={setEndDate} />
          
                </View>
            </View>

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Description", "Description")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-4"
        placeholder={t("Auto.Attr.Whatdidyoudo", "What did you do?")}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top" />
      

            <View className="flex-row justify-end gap-3">
                <TouchableOpacity onPress={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-50 rounded-lg">
                    <Text className="text-red-500 font-medium">{t("Auto.Common.Delete", "Delete")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={isLoading} className="px-4 py-2 bg-[#43C17A] rounded-lg">
                    <Text className="text-white font-medium">{isLoading ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
            </View>
        </View>);

}

export default function ResumeEmployment() {const { t } = useTranslation();
  const { studentId } = useUser();
  const [employments, setEmployments] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const data = await getEmployment(studentId!);
      setEmployments(data);
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load employment" });
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleAdd = () => {
    setEmployments([...employments, { isNew: true }]);
  };

  if (isPageLoading) {
    return (
      <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadingemployme", "Loading employment...")}</Text>
            </View>);

  }

  return (
    <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.Employment", "Employment")}</Text>
                </View>

                {employments.map((item, index) =>
        <EmploymentFormItem
          key={item.employmentId || `new-${index}`}
          item={item}
          studentId={studentId}
          onSaved={loadData}
          onDelete={loadData} />

        )}

                <TouchableOpacity
          onPress={handleAdd}
          className="border-2 border-dashed border-[#43C17A] rounded-lg p-4 items-center justify-center bg-[#43C17A]/5 mt-2">
          
                    <Text className="text-[#43C17A] font-bold">{t("Auto.Common.AddEmployment", "+ Add Employment")}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>);

}