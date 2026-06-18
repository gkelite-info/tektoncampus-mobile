import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import {
  fetchResumeInternships,
  upsertResumeInternship,
  deleteResumeInternship } from
"../../../lib/helpers/resume/resumeInternshipsAPI";

function InternshipFormItem({ item, studentId, onSaved, onDelete }: any) {const { t } = useTranslation();
  const [organizationName, setOrganizationName] = useState(item.organizationName || "");
  const [role, setRole] = useState(item.role || "");
  const [startDate, setStartDate] = useState(item.startDate || "");
  const [endDate, setEndDate] = useState(item.endDate || "");
  const [projectName, setProjectName] = useState(item.projectName || "");
  const [projectUrl, setProjectUrl] = useState(item.projectUrl || "");
  const [location, setLocation] = useState(item.location || "");
  const [domain, setDomain] = useState(item.domain || "");
  const [description, setDescription] = useState(item.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!organizationName.trim() || !role.trim() || !startDate.trim()) {
      Toast.show({ type: "error", text1: "Organization, Role, and Start Date are required" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        resumeInternshipId: item.resumeInternshipId,
        studentId,
        organizationName: organizationName.trim(),
        role: role.trim(),
        startDate,
        endDate: endDate ? endDate : null,
        projectName: projectName.trim(),
        projectUrl: projectUrl.trim(),
        location: location.trim(),
        domain: domain.trim(),
        description: description.trim()
      };

      await upsertResumeInternship(payload);
      Toast.show({ type: "success", text1: "Internship saved successfully" });
      onSaved();
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to save internship" });
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
        if (item.resumeInternshipId) {
          setIsLoading(true);
          try {
            await deleteResumeInternship(item.resumeInternshipId);
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
            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.OrganizationNam", "Organization Name *")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgMicrosoft", "E.g. Microsoft")}
        value={organizationName}
        onChangeText={setOrganizationName} />
      

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Role", "Role *")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgSoftwareEngin", "E.g. Software Engineering Intern")}
        value={role}
        onChangeText={setRole} />
      

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

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ProjectName", "Project Name")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Common.ProjectName", "Project Name")}
            value={projectName}
            onChangeText={setProjectName} />
          
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ProjectURL", "Project URL")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.ProjectLink", "Project Link")}
            value={projectUrl}
            onChangeText={setProjectUrl} />
          
                </View>
            </View>

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Domain", "Domain")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.EgWebDevelopmen", "E.g. Web Development")}
            value={domain}
            onChangeText={setDomain} />
          
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Location", "Location")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.EgRemote", "E.g. Remote")}
            value={location}
            onChangeText={setLocation} />
          
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

export default function ResumeInternships() {const { t } = useTranslation();
  const { studentId } = useUser();
  const [internships, setInternships] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const data = await fetchResumeInternships(studentId!);
      setInternships(data);
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load internships" });
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleAdd = () => {
    setInternships([...internships, { isNew: true }]);
  };

  if (isPageLoading) {
    return (
      <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadinginternsh", "Loading internships...")}</Text>
            </View>);

  }

  return (
    <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.Internships", "Internships")}</Text>
                </View>

                {internships.map((item, index) =>
        <InternshipFormItem
          key={item.resumeInternshipId || `new-${index}`}
          item={item}
          studentId={studentId}
          onSaved={loadData}
          onDelete={loadData} />

        )}

                <TouchableOpacity
          onPress={handleAdd}
          className="border-2 border-dashed border-[#43C17A] rounded-lg p-4 items-center justify-center bg-[#43C17A]/5 mt-2">
          
                    <Text className="text-[#43C17A] font-bold">{t("Auto.Common.AddInternship", "+ Add Internship")}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>);

}