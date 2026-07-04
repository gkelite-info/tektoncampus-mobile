import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { UserCircle, CalendarDays, FileText, FileUp, FileCheck, XCircle } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useTranslations } from "@/utils/useTranslations";
import { deactivateStudentDiscussionUpload, deleteStudentDiscussionFileFromStorage } from "@/lib/helpers/student/assignments/discussionForum/student_discussion_uploadsAPI";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { fonts } from "@/constants/fonts";
import { AttachmentViewerModal } from "./studentDiscussionModals";
interface StudentDiscussionCardProps {
  data: {
    discussionId: number | string;
    title: string;
    description: string;
    facultyName: string;
    createdAt?: string;
    deadline?: string;
    attachments?: Array<{
      fileUrl: string;
    }>;
  };
  isCompleted?: boolean;
  uploadedFiles?: Array<{
    studentDiscussionUploadId: number;
    fileUrl: string;
  }>;
  onRemoveFile?: (index: number) => void;
}
export default function StudentDiscussionCard({
  data,
  isCompleted = false,
  uploadedFiles = [],
  onRemoveFile
}: StudentDiscussionCardProps) {
  const {
    t
  } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [deleteUploadId, setDeleteUploadId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const handleCardClick = () => {
    navigation.navigate(route.name, {
      ...route.params,
      modal: "viewDiscussion",
      discussionId: String(data.discussionId)
    });
  };
  const handleUploadClick = () => {
    navigation.navigate(route.name, {
      ...route.params,
      modal: "uploadDiscussion",
      discussionId: String(data.discussionId)
    });
  };
  const handleOpenFile = (url: string) => {
    if (!url) return;
    setViewerUrl(url);
  };
  const handleRemoveUpload = async () => {
    const {
      t
    } = useTranslation();
    if (!deleteUploadId) return;
    try {
      setIsDeleting(true);
      const fileToDelete = uploadedFiles.find((f: any) => f.studentDiscussionUploadId === deleteUploadId);
      if (fileToDelete?.fileUrl) {
        await deleteStudentDiscussionFileFromStorage(fileToDelete.fileUrl);
      }
      const result = await deactivateStudentDiscussionUpload(deleteUploadId);
      if (result.success) {
        if (onRemoveFile) onRemoveFile(deleteUploadId);
        Toast.show({
          type: "success",
          text1: t("Assignment.student.File removed successfully")
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("Assignment.student.An error occurred")
      });
    } finally {
      setIsDeleting(false);
      setDeleteUploadId(null);
    }
  };
  const getFileName = (url: string) => {
    return url?.split("/").pop()?.split("_").slice(1).join("_") || t("Assignment.student.File", "File");
  };
  return <View className="w-full px-4 mb-4">
            <TouchableOpacity onPress={handleCardClick} activeOpacity={0.7} className="bg-[#F4F5F6] rounded-xl p-4 flex flex-col shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-[#282828] text-[15px] flex-1 pr-2" style={{
          fontFamily: fonts.bold
        }}>
                        {data.title}
                    </Text>
                    {!isCompleted ? <TouchableOpacity onPress={handleUploadClick} className="bg-[#43C17A] px-4 py-1.5 rounded-md gap-2 shadow-sm flex-row items-center">
                            <FileUp size={13} color="#FFFFFF" />
                            <Text className="text-white text-sm" style={{
            fontFamily: fonts.bold
          }}>
                                {t("Assignment.student.Upload")}
                            </Text>
                        </TouchableOpacity> : <View className="bg-[#16284F] px-3 py-1 rounded-md shadow-sm gap-2 flex-row items-center">
                            <FileCheck size={13} color="#FFFFFF" />
                            <Text className="text-white text-sm" style={{
            fontFamily: fonts.bold
          }}>
                                {t("Assignment.student.Uploaded")}
                            </Text>
                        </View>}
                </View>

                <Text className="text-gray-600 text-xs mb-3" numberOfLines={2} style={{
        fontFamily: fonts.regular
      }}>
                    {data.description}
                </Text>

                <View className="flex-col gap-y-1.5 mb-3 w-full">
                    <View className="flex-row items-center gap-x-1.5">
                        <UserCircle size={14} color="#43C17A" />
                        <Text className="text-[11px] text-gray-600" style={{
            fontFamily: fonts.regular
          }}>
                            {t("Assignment.student.Faculty Name :")} {data.facultyName}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-x-1.5">
                        <CalendarDays size={14} color="#43C17A" />
                        <Text className="text-[11px] text-gray-600" style={{
            fontFamily: fonts.regular
          }}>
                            {t("Assignment.student.Uploaded On :")}{" "}
                            {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "—"}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-x-1.5">
                        <CalendarDays size={14} color="#EF4444" />
                        <Text className="text-[11px] text-gray-600" style={{
            fontFamily: fonts.regular
          }}>
                            {t("Assignment.student.Deadline :")}{" "}
                            {data.deadline ? new Date(data.deadline).toLocaleDateString() : "—"}
                        </Text>
                    </View>
                </View>

                <View className="mt-1">
                    <Text className="text-[11px] text-[#282828] mb-1.5" style={{
          fontFamily: fonts.bold
        }}>
                        {t("Assignment.student.Attachments")}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {(data.attachments ?? []).map((file, idx) => <TouchableOpacity key={`fac-m-${idx}`} onPress={() => handleOpenFile(file.fileUrl)} className="flex-row items-center bg-[#e2e8f0] text-[#334155] px-2.5 py-1 rounded border border-slate-300 mr-2">
                                <FileText size={14} color="#16284F" className="mr-1" />
                                <Text className="text-[10px] text-[#334155]" style={{
              fontFamily: fonts.medium
            }}>
                                    {getFileName(file.fileUrl)}
                                </Text>
                            </TouchableOpacity>)}

                        {uploadedFiles.map((file, idx) => <View key={`stu-m-${idx}`} className="flex-row items-center bg-[#e2f6ea] px-2.5 py-1 rounded border border-[#43C17A]/30 mr-2">
                                <TouchableOpacity onPress={() => handleOpenFile(file.fileUrl)} className="flex-row items-center">
                                    <FileText size={14} color="#43C17A" className="mr-1" />
                                    <Text className="text-[10px] text-[#334155] mr-1" style={{
                fontFamily: fonts.medium
              }}>
                                        {getFileName(file.fileUrl)}
                                    </Text>
                                </TouchableOpacity>
                                {!isCompleted && <TouchableOpacity onPress={() => setDeleteUploadId(file.studentDiscussionUploadId)}>
                                        <XCircle size={14} color="#EF4444" />
                                    </TouchableOpacity>}
                            </View>)}

                        {(!data.attachments || data.attachments.length === 0) && (!uploadedFiles || uploadedFiles.length === 0) && <Text className="text-[10px] text-gray-400 italic py-1" style={{
            fontFamily: fonts.regular
          }}>
                                    {t("Assignment.student.No attachments")}
                                </Text>}
                    </ScrollView>
                </View>
            </TouchableOpacity>

            <ConfirmDeleteModal open={!!deleteUploadId} onConfirm={handleRemoveUpload} onCancel={() => setDeleteUploadId(null)} isDeleting={isDeleting} name={t("Assignment.student.uploaded file", "uploaded file")} />

            <AttachmentViewerModal visible={!!viewerUrl} url={viewerUrl || ""} onClose={() => setViewerUrl(null)} />
        </View>;
}