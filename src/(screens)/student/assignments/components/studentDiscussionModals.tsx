import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { Modal, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { X, CloudUpload, FileText, Trash2, Download, UserCircle, CalendarDays } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { fetchStudentDiscussionMarks, saveStudentDiscussionUpload, uploadStudentDiscussionFiles } from "@/lib/helpers/student/assignments/discussionForum/student_discussion_uploadsAPI";
import { useStudent } from "@/utils/context/student/useStudent";
import { useTranslations } from "@/utils/useTranslations";
import { fonts } from "@/constants/fonts";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
interface LocalFileType {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}
export function AttachmentViewerModal({
  visible,
  url,
  onClose
}: {
  visible: boolean;
  url: string;
  onClose: () => void;
}) {
  const {
    t
  } = useTranslation();
  const cleanUrl = url.split("?")[0].toLowerCase();
  const isPdf = cleanUrl.endsWith(".pdf");
  const webViewUrl = isPdf && Platform.OS === "android" ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` : url;
  return <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{
      flex: 1,
      backgroundColor: "white"
    }}>
                <View className="h-[56px] flex-row items-center justify-between px-4 border-b border-gray-200">
                    <Text className="text-base text-gray-800" style={{
          fontFamily: fonts.bold
        }}>{t("Auto.Common.AttachmentViewe", "Attachment Viewer")}

          </Text>
                    <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
                        <X size={20} color="#000000" />
                    </TouchableOpacity>
                </View>
                {webViewUrl ? <WebView source={{
        uri: webViewUrl
      }} style={{
        flex: 1
      }} startInLoadingState /> : <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-500 text-sm" style={{
          fontFamily: fonts.regular
        }}>{t("Auto.Common.NoURLprovided", "No URL provided")}

          </Text>
                    </View>}
            </SafeAreaView>
        </Modal>;
}
export function StudentDiscussionUploadModal({
  discussion,
  onUpload,
  onSuccess
}: {
  discussion: any;
  onUpload: (files: any[]) => void;
  onSuccess?: () => void;
}) {
  const {
    t
  } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [files, setFiles] = useState<LocalFileType[]>([]);
  const {
    studentId
  } = useStudent();
  const [loading, setLoading] = useState(false);
  const handleClose = () => {
    navigation.navigate(route.name, {
      ...route.params,
      modal: undefined,
      discussionId: undefined
    });
  };
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true
      });
      if (!result.canceled && result.assets) {
        const selectedFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? 0,
          mimeType: asset.mimeType
        }));
        setFiles(prev => [...prev, ...selectedFiles]);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to pick document"
      });
    }
  };
  const handleUploadSubmit = async () => {
    if (files.length === 0) {
      Toast.show({
        type: "error",
        text1: "Please select at least one file"
      });
      return;
    }
    if (!studentId) {
      Toast.show({
        type: "error",
        text1: "Student not found"
      });
      return;
    }
    try {
      setLoading(true);
      const fileUrls = await uploadStudentDiscussionFiles(discussion.discussionId, studentId, files as any);
      for (const fileUrl of fileUrls) {
        const result = await saveStudentDiscussionUpload({
          studentId,
          discussionId: discussion.discussionId,
          discussionSectionId: discussion.discussionSectionId,
          fileUrl
        });
        if (!result.success) {
          Toast.show({
            type: "error",
            text1: "Failed to save file record."
          });
          return;
        }
      }
      onUpload(files.map(f => ({
        name: f.name,
        size: (f.size / 1024).toFixed(2) + " KB"
      })));
      Toast.show({
        type: "success",
        text1: "Files uploaded successfully!"
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Upload failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  return <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 justify-center items-center bg-black/40 p-4">
                <TouchableOpacity activeOpacity={1} onPress={handleClose} className="absolute inset-0 w-full h-full" />

                <View className="bg-white rounded-2xl w-full max-w-[340px] p-6 shadow-xl flex-col">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 pr-2">
                            <Text className="text-lg text-[#43C17A]" style={{
              fontFamily: fonts.bold
            }}>{discussion.title}</Text>
                            <Text className="text-base text-[#282828] mt-1" style={{
              fontFamily: fonts.bold
            }}>{t("Upload")}</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} className="p-1">
                            <X size={22} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-col gap-y-4">
                        <TouchableOpacity onPress={pickDocument} activeOpacity={0.8} className="border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-2xl p-6 flex-col items-center justify-center gap-y-2">
              
                            <CloudUpload size={40} color="#9CA3AF" />
                            <Text className="text-sm text-gray-600 text-center" style={{
              fontFamily: fonts.regular
            }}>{t("Auto.Common.Tapheretochoose", "Tap here to choose documents")}

              </Text>
                        </TouchableOpacity>

                        {files.length > 0 && <ScrollView className="max-h-[140px] pr-1">
                                <View className="flex-col gap-y-2">
                                    {files.map((file, idx) => {
                
                return <View key={idx} className="flex-row items-center justify-between border border-green-100 rounded-lg p-2.5 bg-white">
                                            <View className="flex-1 flex-row items-center gap-x-2 pr-2">
                                                <FileText size={20} color="#EF4444" />
                                                <View className="flex-1 flex-col">
                                                    <Text numberOfLines={1} className="text-xs text-[#282828]" style={{
                        fontFamily: fonts.medium
                      }}>{file.name}</Text>
                                                    <Text className="text-[10px] text-gray-400" style={{
                        fontFamily: fonts.regular
                      }}>{(file.size / 1024).toFixed(2)}{t("Auto.Common.KB", "KB")}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 bg-red-100 rounded">
                    
                                                <Trash2 size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>;
              })}
                                </View>
                            </ScrollView>}
                    </View>

                    <View className="flex-row items-center mt-6 gap-x-3">
                        <TouchableOpacity onPress={handleClose} className="flex-1 py-3 border border-gray-200 bg-white rounded-xl">
                            <Text className="text-center text-sm text-gray-600" style={{
              fontFamily: fonts.bold
            }}>{t("Auto.Common.Cancel", "Cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleUploadSubmit} disabled={loading} className="flex-1 py-3 bg-[#43C17A] rounded-xl flex-row items-center justify-center shadow-sm">
              
                            {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text className="text-center text-sm text-white" style={{
              fontFamily: fonts.bold
            }}>{t("Auto.Common.UploadFile", "Upload File")}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>;
}
async function requestStoragePermission() {
  if (Platform.OS !== "android") return true;
  try {
    if (Number(Platform.Version) >= 33) {
      return true;
    }
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
      title: "Storage Permission Required",
      message: "This app needs access to your storage to download discussion files.",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK"
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}
export function StudentDiscussionDetailsModal({
  discussion
}: {
  discussion: any;
}) {
  const {
    t
  } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    studentId
  } = useStudent();
  const [marks, setMarks] = useState<{
    marksObtained: number | null;
    totalMarks: number | null;
  } | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!studentId || !discussion?.discussionId) return;
    fetchStudentDiscussionMarks(discussion.discussionId, studentId).then(setMarks).catch(() => setMarks(null));
  }, [studentId, discussion?.discussionId]);
  const handleClose = () => {
    navigation.navigate(route.name, {
      ...route.params,
      modal: undefined,
      discussionId: undefined
    });
  };
  const handleOpenFile = (url: string) => {
    if (!url) return;
    setViewerUrl(url);
  };
  const handleDownloadFile = async (url: string) => {
    if (!url) return;
    try {
      Toast.show({
        type: "info",
        text1: "Downloading file..."
      });
      const fileName = url.split("/").pop()?.split("?")[0] || "attachment";
      const decodedFileName = decodeURIComponent(fileName).split("_").slice(1).join("_") || decodeURIComponent(fileName);
      if (Platform.OS === "android") {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Toast.show({
            type: "error",
            text1: "Storage permission denied"
          });
          return;
        }
        const publicDownloadUri = `file:///storage/emulated/0/Download/${decodedFileName}`;
        try {
          await FileSystem.downloadAsync(url, publicDownloadUri);
          Toast.show({
            type: "success",
            text1: "File downloaded to Downloads folder!"
          });
          return;
        } catch (androidError) {
          console.log("Direct download to Downloads failed, falling back:", androidError);
        }
      }
      const localUri = `${FileSystem.documentDirectory}${decodedFileName}`;
      await FileSystem.downloadAsync(url, localUri);
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(localUri);
        Toast.show({
          type: "success",
          text1: "File downloaded successfully!"
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Sharing not available on this device"
        });
      }
    } catch (error) {
      console.error("Download failed:", error);
      Toast.show({
        type: "error",
        text1: "Failed to download file"
      });
    }
  };
  const handleDownloadAll = () => {
    if (discussion.attachments?.length > 0) {
      const firstAttachment = discussion.attachments[0];
      if (firstAttachment?.fileUrl) {
        handleDownloadFile(firstAttachment.fileUrl);
      }
    } else {
      Toast.show({
        type: "error",
        text1: "No attachments available to download"
      });
    }
  };
  return <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 justify-center items-center bg-black/40 p-4">
                <TouchableOpacity activeOpacity={1} onPress={handleClose} className="absolute inset-0 w-full h-full" />

                <View className="bg-white rounded-[24px] w-full max-w-[340px] flex-col overflow-hidden" style={{
        height: "80%"
      }}>
                    <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                        <Text className="text-xl text-[#43C17A]" style={{
            fontFamily: fonts.bold
          }}>
                            {t("Discussion forum")}
                        </Text>
                        <TouchableOpacity onPress={handleClose} className="p-1">
                            <X size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 py-4" contentContainerStyle={{
          paddingBottom: 24
        }}>
            
                        <View className="flex-col gap-y-3">
                            <View className="flex-row items-center gap-x-2.5">
                                <View className="bg-[#E2F3E9] p-1 rounded-full">
                                    <UserCircle size={16} color="#43C17A" />
                                </View>
                                <Text className="text-sm text-[#282828]" style={{
                fontFamily: fonts.bold
              }}>
                                    {t("Faculty Name :")}{" "}
                                    <Text className="text-gray-500" style={{
                  fontFamily: fonts.regular
                }}>
                                        {discussion.facultyName}
                                    </Text>
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-x-2.5">
                                <View className="bg-[#E2F3E9] p-1 rounded-full">
                                    <CalendarDays size={16} color="#43C17A" />
                                </View>
                                <Text className="text-sm text-[#282828]" style={{
                fontFamily: fonts.bold
              }}>
                                    {t("Uploaded On :")}{" "}
                                    <Text className="text-gray-500" style={{
                  fontFamily: fonts.regular
                }}>
                                        {discussion.createdAt ? new Date(discussion.createdAt).toLocaleDateString() : "—"}
                                    </Text>
                                </Text>
                            </View>

                            <TouchableOpacity onPress={handleDownloadAll} activeOpacity={0.8} className="bg-[#43C17A] px-4 py-2 rounded-xl flex-row items-center gap-x-2 self-start mt-2 mb-2 shadow-xs">
                
                                <Text className="text-white text-sm" style={{
                fontFamily: fonts.bold
              }}>
                                    {t("Download")}
                                </Text>
                                <View className="bg-white rounded-full p-0.5 items-center justify-center">
                                    <Download size={12} color="#43C17A" />
                                </View>
                            </TouchableOpacity>

                            <View className="flex-row items-center mb-1">
                                <Text className="text-sm text-[#282828]" style={{
                fontFamily: fonts.bold
              }}>
                                    {t("Marks Scored :")}{" "}
                                    <Text className="text-[#FF5A1F]" style={{
                  fontFamily: fonts.bold
                }}>
                                        {marks?.marksObtained !== null && marks?.marksObtained !== undefined ? `${marks?.marksObtained}` : "-"}
                                    </Text>
                                </Text>
                            </View>

                            <View className="border-t border-gray-100 pt-3 flex-col gap-y-4">
                                <View className="flex-col">
                                    <Text className="text-xs text-[#282828]" style={{
                  fontFamily: fonts.bold
                }}>
                                        {t("Description")}
                                    </Text>
                                    <Text className="text-xs text-gray-500 mt-1 leading-5" style={{
                  fontFamily: fonts.regular
                }}>
                                        {discussion.description ?? t("No description provided.")}
                                    </Text>
                                </View>

                                <View className="flex-col">
                                    <Text className="text-xs text-[#282828]" style={{
                  fontFamily: fonts.bold
                }}>
                                        {t("Deadline")}
                                    </Text>
                                    <Text className="text-xs text-gray-500 mt-0.5" style={{
                  fontFamily: fonts.regular
                }}>
                                        {discussion.deadline ? new Date(discussion.deadline).toLocaleDateString() : "—"}
                                    </Text>
                                </View>

                                <View className="flex-col">
                                    <Text className="text-xs text-[#282828]" style={{
                  fontFamily: fonts.bold
                }}>
                                        {t("Total Marks")}
                                    </Text>
                                    <Text className="text-xs text-gray-500 mt-0.5" style={{
                  fontFamily: fonts.regular
                }}>
                                        {discussion.marks ?? "—"}
                                    </Text>
                                </View>

                                {discussion.attachments?.length > 0 && <View className="flex-col">
                                        <Text className="text-xs text-[#282828] mb-1.5" style={{
                  fontFamily: fonts.bold
                }}>
                                            {t("Attachments")}
                                        </Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {discussion.attachments.map((file: {
                    fileUrl: string;
                  }, idx: number) => <TouchableOpacity key={idx} onPress={() => handleOpenFile(file.fileUrl)} className="flex-row items-center gap-x-1.5 bg-[#e2e8f0] px-2.5 py-1.5 rounded-lg">
                      
                                                    <FileText size={12} color="#1E293B" />
                                                    <Text numberOfLines={1} className="text-[10px] text-[#334155] max-w-[120px]" style={{
                      fontFamily: fonts.semiBold
                    }}>
                                                        {file.fileUrl?.split("/").pop()?.split("_").slice(1).join("_") || "File"}
                                                    </Text>
                                                </TouchableOpacity>)}
                                        </View>
                                    </View>}
                            </View>
                        </View>
                    </ScrollView>

                    <View className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
                        <TouchableOpacity onPress={handleClose} activeOpacity={0.7} className="w-full bg-white border border-gray-300 py-3 rounded-xl items-center justify-center">
              
                            <Text className="text-gray-700 text-sm" style={{
              fontFamily: fonts.bold
            }}>
                                {t("Close")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <AttachmentViewerModal visible={!!viewerUrl} url={viewerUrl || ""} onClose={() => setViewerUrl(null)} />
      
        </Modal>;
}