import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from "react-native";
import { X, CloudUpload, FileText, Trash2, Download, UserCircle, CalendarDays } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
    fetchStudentDiscussionMarks,
    saveStudentDiscussionUpload,
    uploadStudentDiscussionFiles,
} from "@/lib/helpers/student/assignments/discussionForum/student_discussion_uploadsAPI";
import { useStudent } from "@/utils/context/student/useStudent";

interface LocalFileType {
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
}

export function StudentDiscussionUploadModal({
    discussion,
    onUpload,
    onSuccess,
}: {
    discussion: any;
    onUpload: (files: any[]) => void;
    onSuccess?: () => void;
}) {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [files, setFiles] = useState<LocalFileType[]>([]);
    const { studentId } = useStudent();
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        navigation.navigate(route.name, {
            ...route.params,
            modal: undefined,
            discussionId: undefined,
        });
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                multiple: true,
            });

            if (!result.canceled && result.assets) {
                const selectedFiles = result.assets.map(asset => ({
                    uri: asset.uri,
                    name: asset.name,
                    size: asset.size ?? 0,
                    mimeType: asset.mimeType,
                }));
                setFiles(prev => [...prev, ...selectedFiles]);
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to pick document" });
        }
    };

    const handleUploadSubmit = async () => {
        if (files.length === 0) {
            Toast.show({ type: "error", text1: "Please select at least one file" });
            return;
        }

        if (!studentId) {
            Toast.show({ type: "error", text1: "Student not found" });
            return;
        }

        try {
            setLoading(true);

            const fileUrls = await uploadStudentDiscussionFiles(
                discussion.discussionId,
                studentId,
                files as any,
            );

            for (const fileUrl of fileUrls) {
                const result = await saveStudentDiscussionUpload({
                    studentId,
                    discussionId: discussion.discussionId,
                    discussionSectionId: discussion.discussionSectionId,
                    fileUrl,
                });

                if (!result.success) {
                    Toast.show({ type: "error", text1: "Failed to save file record." });
                    return;
                }
            }

            onUpload(
                files.map(f => ({
                    name: f.name,
                    size: (f.size / 1024).toFixed(2) + " KB",
                })),
            );

            Toast.show({ type: "success", text1: "Files uploaded successfully!" });
            onSuccess?.();
            handleClose();
        } catch (error) {
            Toast.show({ type: "error", text1: "Upload failed. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 justify-center items-center bg-black/40 p-4">
                <TouchableOpacity activeOpacity={1} onPress={handleClose} className="absolute inset-0 w-full h-full" />

                <View className="bg-white rounded-2xl w-full max-w-[340px] p-6 shadow-xl flex-col">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 pr-2">
                            <Text className="text-lg font-bold text-[#43C17A]">{discussion.title}</Text>
                            <Text className="text-base font-bold text-[#282828] mt-1">Upload</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} className="p-1">
                            <X size={22} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-col gap-y-4">
                        <TouchableOpacity
                            onPress={pickDocument}
                            activeOpacity={0.8}
                            className="border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-2xl p-6 flex-col items-center justify-center gap-y-2"
                        >
                            <CloudUpload size={40} color="#9CA3AF" />
                            <Text className="text-sm text-gray-600 text-center">Tap here to choose documents</Text>
                        </TouchableOpacity>

                        {files.length > 0 && (
                            <ScrollView className="max-h-[140px] pr-1">
                                <View className="flex-col gap-y-2">
                                    {files.map((file, idx) => (
                                        <View key={idx} className="flex-row items-center justify-between border border-green-100 rounded-lg p-2.5 bg-white">
                                            <View className="flex-1 flex-row items-center gap-x-2 pr-2">
                                                <FileText size={20} color="#EF4444" />
                                                <View className="flex-1 flex-col">
                                                    <Text numberOfLines={1} className="text-xs font-medium text-[#282828]">{file.name}</Text>
                                                    <Text className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(2)} KB</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                className="p-1.5 bg-red-100 rounded"
                                            >
                                                <Trash2 size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    <View className="flex-row items-center mt-6 gap-x-3">
                        <TouchableOpacity onPress={handleClose} className="flex-1 py-3 border border-gray-200 bg-white rounded-xl">
                            <Text className="text-center font-bold text-sm text-gray-600">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleUploadSubmit}
                            disabled={loading}
                            className="flex-1 py-3 bg-[#43C17A] rounded-xl flex-row items-center justify-center shadow-sm"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-center font-bold text-sm text-white">Upload File</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function StudentDiscussionDetailsModal({
    discussion,
}: {
    discussion: any;
}) {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { studentId } = useStudent();
    const [marks, setMarks] = useState<{ marksObtained: number | null; totalMarks: number | null } | null>(null);

    useEffect(() => {
        if (!studentId || !discussion?.discussionId) return;
        fetchStudentDiscussionMarks(discussion.discussionId, studentId)
            .then(setMarks)
            .catch(() => setMarks(null));
    }, [studentId, discussion?.discussionId]);

    const handleClose = () => {
        navigation.navigate(route.name, {
            ...route.params,
            modal: undefined,
            discussionId: undefined,
        });
    };

    const handleOpenFile = async (url: string) => {
        if (!url) return;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Toast.show({ type: "error", text1: "Cannot open this attachment link" });
        }
    };

    const handleDownloadAll = async () => {
        if (discussion.attachments?.length > 0) {
            for (const file of discussion.attachments) {
                if (file.fileUrl) {
                    await handleOpenFile(file.fileUrl);
                }
            }
        } else {
            Toast.show({ type: "error", text1: "No attachments available to download" });
        }
    };

    return (
        <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 justify-center items-center bg-black/40 p-4">
                <TouchableOpacity activeOpacity={1} onPress={handleClose} className="absolute inset-0 w-full h-full" />

                <View className="bg-white rounded-2xl w-full max-w-[340px] p-5 shadow-xl flex-col max-h-[80vh]">
                    <View className="flex-row justify-between items-start border-b border-gray-100 pb-3 mb-3">
                        <View className="flex-1 pr-2">
                            <Text className="text-lg font-bold text-[#43C17A] mb-1.5">{discussion.title}</Text>

                            <View className="flex-col gap-y-1">
                                <View className="flex-row items-center gap-x-1.5">
                                    <UserCircle size={14} color="#43C17A" />
                                    <Text numberOfLines={1} className="text-[11px] font-bold text-[#282828]">
                                        Faculty: <Text className="font-normal text-gray-600">{discussion.facultyName}</Text>
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-x-1.5">
                                    <CalendarDays size={14} color="#43C17A" />
                                    <Text className="text-[11px] font-bold text-[#282828]">
                                        Uploaded: <Text className="font-normal text-gray-600">{discussion.createdAt ? new Date(discussion.createdAt).toLocaleDateString() : "—"}</Text>
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleClose} className="p-1">
                            <X size={22} color="#43C17A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 pr-1">
                        <View className="flex-col gap-y-3">
                            <View className="flex-row items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                                <Text className="text-xs text-[#282828] font-medium">Marks Scored:</Text>
                                <Text className="text-xs font-bold text-orange-600">
                                    {marks?.marksObtained !== null ? `${marks?.marksObtained}` : "-"}
                                </Text>
                            </View>

                            <View className="flex-col">
                                <Text className="text-xs font-bold text-[#282828] mb-1">Description</Text>
                                <Text className="text-xs text-[#282828] leading-5 bg-gray-50 p-2.5 rounded-xl">
                                    {discussion.description ?? "No description provided."}
                                </Text>
                            </View>

                            <View className="flex-row justify-between border-t border-b border-gray-100 py-2">
                                <View className="flex-col">
                                    <Text className="text-[11px] font-bold text-[#282828]">Deadline</Text>
                                    <Text className="text-xs text-gray-600 mt-0.5">
                                        {discussion.deadline ? new Date(discussion.deadline).toLocaleDateString() : "—"}
                                    </Text>
                                </View>
                                <View className="flex-col items-end">
                                    <Text className="text-[11px] font-bold text-[#282828]">Total Marks</Text>
                                    <Text className="text-xs text-gray-600 mt-0.5">{discussion.marks ?? "—"}</Text>
                                </View>
                            </View>

                            {discussion.attachments?.length > 0 && (
                                <View className="flex-col">
                                    <Text className="text-xs font-bold text-[#282828] mb-1.5">Attachments</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {discussion.attachments.map((file: { fileUrl: string }, idx: number) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => handleOpenFile(file.fileUrl)}
                                                className="flex-row items-center gap-x-1.5 bg-[#e2e8f0] px-2.5 py-1.5 rounded-lg"
                                            >
                                                <FileText size={12} color="#1E293B" />
                                                <Text numberOfLines={1} className="text-[10px] font-semibold text-[#334155] max-w-[120px]">
                                                    {file.fileUrl?.split("/").pop()?.split("_").slice(1).join("_") || "File"}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View className="flex-row gap-x-3 mt-4 pt-2 border-t border-gray-100">
                        <TouchableOpacity onPress={handleClose} className="flex-1 py-2.5 border border-gray-200 bg-white rounded-xl">
                            <Text className="text-center font-bold text-xs text-gray-600">Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDownloadAll}
                            className="flex-1 py-2.5 bg-[#43C17A] rounded-xl flex-row items-center justify-center gap-x-1.5 shadow-sm"
                        >
                            <Text className="text-center font-bold text-xs text-white">Open Links</Text>
                            <Download size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}