import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import {
  fetchResumeProjects,
  upsertResumeProject,
  deleteResumeProject } from
"../../../lib/helpers/resume/resumeProjectsAPI";

function ProjectFormItem({ item, studentId, onSaved, onDelete }: any) {const { t } = useTranslation();
  const [projectName, setProjectName] = useState(item.projectName || "");
  const [domain, setDomain] = useState(item.domain || "");
  const [startDate, setStartDate] = useState(item.startDate || "");
  const [endDate, setEndDate] = useState(item.endDate || "");
  const [projectUrl, setProjectUrl] = useState(item.projectUrl || "");
  const [tools, setTools] = useState(item.toolsAndTechnologies ? item.toolsAndTechnologies.join(", ") : "");
  const [description, setDescription] = useState(item.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!projectName.trim() || !domain.trim() || !startDate.trim()) {
      Toast.show({ type: "error", text1: "Project Name, Domain, and Start Date are required" });
      return;
    }

    setIsLoading(true);
    try {
      const parsedTools = tools.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0);

      const payload = {
        resumeProjectId: item.resumeProjectId,
        studentId,
        projectName: projectName.trim(),
        domain: domain.trim(),
        startDate,
        endDate: endDate ? endDate : null,
        projectUrl: projectUrl.trim(),
        toolsAndTechnologies: parsedTools.length > 0 ? parsedTools : null,
        description: description.trim()
      };

      await upsertResumeProject(payload);
      Toast.show({ type: "success", text1: "Project saved successfully" });
      onSaved();
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to save project" });
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
        if (item.resumeProjectId) {
          setIsLoading(true);
          try {
            await deleteResumeProject(item.resumeProjectId);
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
            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ProjectName", "Project Name *")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgECommerceWebs", "E.g. E-Commerce Website")}
        value={projectName}
        onChangeText={setProjectName} />
      

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Domain", "Domain *")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgWebDevelopmen", "E.g. Web Development")}
        value={domain}
        onChangeText={setDomain} />
      

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
            placeholder={t("Auto.Attr.YYYYMMDD", "YYYY-MM-DD")}
            value={endDate}
            onChangeText={setEndDate} />
          
                </View>
            </View>

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ProjectURL", "Project URL")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.https", "https://...")}
        value={projectUrl}
        onChangeText={setProjectUrl} />
      

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ToolsTechnologi", "Tools & Technologies (comma separated)")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
        placeholder={t("Auto.Attr.EgReactNodejsMo", "E.g. React, Node.js, MongoDB")}
        value={tools}
        onChangeText={setTools} />
      

            <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Description", "Description")}</Text>
            <TextInput
        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-4"
        placeholder={t("Auto.Attr.Describeyourpro", "Describe your project")}
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

export default function ResumeProjects() {const { t } = useTranslation();
  const { studentId } = useUser();
  const [projects, setProjects] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const data = await fetchResumeProjects(studentId!);
      setProjects(data);
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load projects" });
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleAdd = () => {
    setProjects([...projects, { isNew: true }]);
  };

  if (isPageLoading) {
    return (
      <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadingprojects", "Loading projects...")}</Text>
            </View>);

  }

  return (
    <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.Projects", "Projects")}</Text>
                </View>

                {projects.map((item, index) =>
        <ProjectFormItem
          key={item.resumeProjectId || `new-${index}`}
          item={item}
          studentId={studentId}
          onSaved={loadData}
          onDelete={loadData} />

        )}

                <TouchableOpacity
          onPress={handleAdd}
          className="border-2 border-dashed border-[#43C17A] rounded-lg p-4 items-center justify-center bg-[#43C17A]/5 mt-2">
          
                    <Text className="text-[#43C17A] font-bold">{t("Auto.Common.AddProject", "+ Add Project")}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>);

}