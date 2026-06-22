import React, { useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/AppText";
import { CaretLeft, X, CloudArrowUp, Paperclip, User } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
import * as DocumentPicker from "expo-document-picker";
import { Avatar } from "@/components/Avatar";
import { ProjectCardProps } from "./ProjectCard";
import {
  submitProject,
  uploadFileToStorage,
} from "@/lib/helpers/student/student_project_submissionsAPI";

type ProjectDetailsModalProps = {
  project: ProjectCardProps;
  onClose: () => void;
  role: string | null;
  studentId: number | null;
};

const MemberAvatar = ({
  image,
  name,
  index,
}: {
  image?: string | null;
  name?: string;
  index: number;
}) => {
  return (
    <View
      className={`rounded-full border-2 border-white bg-gray-200 ${
        index > 0 ? "-ml-3" : ""
      }`}
    >
      <Avatar src={image} size={36} />
    </View>
  );
};

export const ProjectDetailsModal = ({
  project,
  onClose,
  role,
  studentId,
}: ProjectDetailsModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const domains = project.techStack
    ? project.techStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error("Document picking error:", err);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleFinalSubmit = async () => {
    if (!selectedFile) return;
    if (!studentId) {
      Alert.alert(
        t("Projects.student.Error", "Error"),
        t("Projects.student.Error: Student ID not found Please log in again")
      );
      return;
    }

    setIsUploading(true);
    try {
      const uploadResult = await uploadFileToStorage(
        selectedFile,
        project.projectId!,
        studentId
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error((uploadResult.error as any)?.message || t("Projects.student.Upload to storage failed"));
      }

      const dbResult = await submitProject({
        projectId: project.projectId,
        studentId: studentId,
        fileUrl: uploadResult.url,
      });

      if (dbResult.success) {
        Alert.alert(
          t("Projects.student.Success", "Success"),
          t("Projects.student.Submission successful 🎉")
        );
        setSelectedFile(null);
        onClose();
      } else {
        throw new Error(t("Projects.student.Failed to save submission record"));
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      Alert.alert(
        t("Projects.student.Error", "Error"),
        error.message || t("Projects.student.Something went wrong during submission")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        t("Projects.student.Error", "Error"),
        t("Projects.student.CannotOpenURL", "Cannot open link: ") + url
      );
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="flex-row items-center gap-2">
            <CaretLeft size={22} color="#4b5563" />
            <Text className="text-lg font-semibold text-gray-800" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Project Details")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4 pb-6" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text className="text-2xl font-semibold text-[#16a34a] mb-6" style={{ fontFamily: fonts.semiBold }}>
            {project.title}
          </Text>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Description")}
            </Text>
            <Text className="text-base text-gray-700 leading-relaxed" style={{ fontFamily: fonts.regular }}>
              {project.description || t("Projects.student.No description provided")}
            </Text>
          </View>

          {/* Domains */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Domains")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {domains.length > 0 ? (
                domains.map((d, i) => (
                  <View key={i} className="px-3 py-1.5 rounded-full bg-[#16284F21]">
                    <Text className="text-[#16284F] text-sm font-medium" style={{ fontFamily: fonts.medium }}>
                      {d}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-sm italic" style={{ fontFamily: fonts.regular }}>
                  {t("Projects.student.No domains specified")}
                </Text>
              )}
            </View>
          </View>

          {/* Duration */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Duration")}
            </Text>
            <View className="self-start px-4 py-1.5 rounded-full bg-[#EFE8FF]">
              <Text className="text-[#5B4FE1] text-sm font-medium" style={{ fontFamily: fonts.medium }}>
                {project.duration}
              </Text>
            </View>
          </View>

          {/* Team Members */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Team Members")}
            </Text>
            <View className="flex-row items-center flex-wrap">
              {project.teamMembers && project.teamMembers.length > 0 ? (
                project.teamMembers.map((member, i) => (
                  <MemberAvatar key={i} image={member.image} name={member.name} index={i} />
                ))
              ) : (
                <Text className="text-gray-400 text-sm italic" style={{ fontFamily: fonts.regular }}>
                  {t("Projects.student.No members assigned")}
                </Text>
              )}
            </View>
          </View>

          {/* Mentors */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Mentors")}
            </Text>
            <View className="flex-col gap-3">
              {project.mentors && project.mentors.length > 0 ? (
                project.mentors.map((mentor, i) => (
                  <View key={i} className="flex-row items-center gap-3">
                    <Avatar src={mentor.image} size={40} />
                    <View>
                      <Text className="text-sm font-semibold text-gray-900" style={{ fontFamily: fonts.semiBold }}>
                        {mentor.name}
                      </Text>
                      <Text className="text-xs text-gray-500" style={{ fontFamily: fonts.regular }}>
                        {t("Projects.student.Faculty / Guide")}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-sm italic" style={{ fontFamily: fonts.regular }}>
                  {t("Projects.student.No mentor assigned")}
                </Text>
              )}
            </View>
          </View>

          {/* Marks */}
          <View className="mb-5">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Marks")}
            </Text>
            <View className="self-start px-4 py-1.5 rounded-full bg-green-50">
              <Text className="text-green-700 text-sm font-semibold" style={{ fontFamily: fonts.semiBold }}>
                {project.marks} {t("Projects.student.pts")}
              </Text>
            </View>
          </View>

          {/* Attachments */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: fonts.semiBold }}>
              {t("Projects.student.Attachments")}
            </Text>
            <View className="flex-col">
              {project.fileUrls && project.fileUrls.length > 0 ? (
                project.fileUrls.map((url, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleOpenURL(url)}
                    className="mb-2"
                  >
                    <Text
                      className="text-blue-600 underline"
                      style={{ fontFamily: fonts.regular }}
                    >
                      {url.split("/").pop() || "Attachment"}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-gray-400 text-sm italic" style={{ fontFamily: fonts.regular }}>
                  {t("Projects.student.No attachments uploaded")}
                </Text>
              )}
            </View>
          </View>

          {/* File Upload (Student Only) */}
          {role === "Student" && (
            <View className="border-t border-slate-100 pt-6 pb-12">
              <Text className="text-lg font-semibold text-gray-900 mb-3" style={{ fontFamily: fonts.semiBold }}>
                {t("Projects.student.Upload Your Project")}
              </Text>

              {/* Upload Drop Zone Trigger */}
              <TouchableOpacity
                onPress={handleFilePick}
                className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-6 items-center justify-center"
              >
                <CloudArrowUp size={36} color="#94A3B8" />
                <Text className="text-slate-500 text-xs text-center mt-2 mb-4" style={{ fontFamily: fonts.regular }}>
                  {t("Projects.student.Drag & Drop Your File here or")}
                </Text>
                <View className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                  <Text className="text-slate-700 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>
                    {t("Projects.student.Browse Files")}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Selected File Details */}
              {selectedFile && (
                <View className="mt-4 flex-row items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                  <View className="flex-1 flex-row items-center gap-2 overflow-hidden mr-2">
                    <View className="w-8 h-8 bg-emerald-100 rounded items-center justify-center">
                      <Text className="text-emerald-700 text-[10px] font-bold uppercase">
                        {selectedFile.name.split(".").pop()?.substring(0, 3) || "FILE"}
                      </Text>
                    </View>
                    <Text className="text-slate-800 text-xs font-semibold truncate flex-1" style={{ fontFamily: fonts.medium }}>
                      {selectedFile.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={removeFile} className="p-1">
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit Action */}
              {selectedFile && (
                <TouchableOpacity
                  onPress={handleFinalSubmit}
                  disabled={isUploading}
                  className={`mt-4 w-full h-11 rounded-xl items-center justify-center shadow-md ${
                    isUploading ? "bg-slate-400" : "bg-[#16a34a]"
                  }`}
                >
                  {isUploading ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white text-xs font-semibold" style={{ fontFamily: fonts.medium }}>
                        {t("Projects.student.Uploading")}...
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                      {t("Projects.student.Submit Files")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
