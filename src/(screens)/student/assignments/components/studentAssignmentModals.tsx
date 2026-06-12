import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Platform,
} from "react-native";
import { X, CloudArrowUp, FilePdf } from "phosphor-react-native";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { fonts } from "@/constants/fonts";
import { supabase } from "@/lib/supabaseClient";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import {
    insertAssignmentSubmission,
    deleteAssignmentSubmission,
} from "@/lib/helpers/student/assignments/insertAssignmentSubmission";

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

async function uploadAssignmentFile(
    assignmentId: number,
    studentId: number,
    file: { uri: string; name: string; mimeType?: string }
): Promise<string> {
    const fileName = `${assignmentId}/${studentId}/${Date.now()}_${file.name}`;

    try {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        const arrayBuffer = decode(base64);

        const { error } = await supabase.storage
            .from("student_submissions")
            .upload(fileName, arrayBuffer, {
                contentType: file.mimeType || "application/pdf",
                cacheControl: "3600",
                upsert: false,
            });

        if (error) throw error;
        return fileName;
    } catch (error) {
        console.error("uploadAssignmentFile error:", error);
        throw error;
    }
}

async function deleteAssignmentFileFromStorage(filePath: string) {
    const { error } = await supabase.storage
        .from("student_submissions")
        .remove([filePath]);

    if (error) {
        console.error("deleteAssignmentFileFromStorage error:", error);
        return { success: false };
    }

    return { success: true };
}

interface UploadModalProps {
    visible: boolean;
    onClose: () => void;
    assignment: any;
    studentId: number;
    existingFilePath: string | null;
    onUploadSuccess: (newFilePath: string | null) => void;
}

export function StudentAssignmentUploadModal({
    visible,
    onClose,
    assignment,
    studentId,
    existingFilePath,
    onUploadSuccess,
}: UploadModalProps) {
    const [file, setFile] = useState<{ name: string; uri: string; size?: number; mimeType?: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (visible) {
            if (existingFilePath) {
                const fileName = existingFilePath.split("/").pop() || "Attached File.pdf";
                setFile({
                    name: fileName,
                    uri: "",
                    size: 0,
                });

                // Fetch actual metadata from Supabase Storage
                const parts = existingFilePath.split("/");
                const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
                const searchName = parts[parts.length - 1];

                supabase.storage
                    .from("student_submissions")
                    .list(folder, { search: searchName })
                    .then(({ data, error }) => {
                        if (isMounted && data && data.length > 0 && !error) {
                            const fileInfo = data.find(f => f.name === searchName) || data[0];
                            setFile({
                                name: fileName,
                                uri: "",
                                size: fileInfo.metadata?.size ?? 0,
                            });
                        }
                    })
                    .catch((err) => console.log("Failed to list storage file:", err));
            } else {
                setFile(null);
            }
        }
        return () => {
            isMounted = false;
        };
    }, [visible, existingFilePath]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                multiple: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (asset.mimeType !== "application/pdf" && !asset.name.toLowerCase().endsWith(".pdf")) {
                    Toast.show({ type: "error", text1: "Only PDF files are allowed" });
                    return;
                }
                setFile({
                    uri: asset.uri,
                    name: asset.name,
                    size: asset.size ?? 0,
                    mimeType: asset.mimeType,
                });
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to pick document" });
        }
    };

    const handleDeleteFile = async () => {
        if (!file) return;

        if (file.uri === "") {
            try {
                setDeleting(true);
                if (existingFilePath) {
                    await deleteAssignmentFileFromStorage(existingFilePath);
                }
                const res = await deleteAssignmentSubmission(Number(assignment.assignmentId), studentId);
                if (res.success) {
                    setFile(null);
                    onUploadSuccess(null);
                    Toast.show({ type: "success", text1: "File deleted successfully" });
                } else {
                    Toast.show({ type: "error", text1: res.error || "Failed to delete file" });
                }
            } catch (err) {
                Toast.show({ type: "error", text1: "Failed to delete file" });
            } finally {
                setDeleting(false);
            }
        } else {
            setFile(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            Toast.show({ type: "error", text1: "Please select a file first" });
            return;
        }

        if (file.uri === "") {
            onClose();
            return;
        }

        try {
            setUploading(true);
            const uploadedPath = await uploadAssignmentFile(
                Number(assignment.assignmentId),
                studentId,
                file
            );

            const res = await insertAssignmentSubmission({
                assignmentId: Number(assignment.assignmentId),
                filePath: uploadedPath,
            });

            if (res.success) {
                Toast.show({ type: "success", text1: "Assignment submitted successfully 🎉" });
                onUploadSuccess(uploadedPath);
                onClose();
            } else {
                Toast.show({ type: "error", text1: res.error || "Failed to save submission" });
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to upload file" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center bg-black/40 p-4">
                <TouchableOpacity activeOpacity={1} onPress={onClose} className="absolute inset-0 w-full h-full" />

                <View className="bg-white rounded-2xl w-full max-w-[340px] p-6 shadow-xl flex-col">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 pr-2">
                            <Text className="text-2xl text-[#282828]" style={{ fontFamily: fonts.bold }}>
                                Upload Assignment
                            </Text>
                            <Text className="text-base text-gray-500 mt-2" style={{ fontFamily: fonts.regular }}>
                                Submit your assignment file in the required format.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <X size={20} color="#000000" weight="bold" />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-4">
                        <Text className="text-base text-[#282828] mb-2" style={{ fontFamily: fonts.bold }}>
                            Assignment Details
                        </Text>
                        <View className="flex-col gap-2">
                            <Text className="text-base text-gray-600" style={{ fontFamily: fonts.regular }}>
                                <Text style={{ fontFamily: fonts.medium }}>Subject : </Text>
                                {assignment?.subjectName || "—"}
                            </Text>
                            <Text className="text-base text-gray-600" style={{ fontFamily: fonts.regular }}>
                                <Text style={{ fontFamily: fonts.medium }}>Topic : </Text>
                                {assignment?.title || "—"}
                            </Text>
                            <Text className="text-base text-gray-600" style={{ fontFamily: fonts.regular }}>
                                <Text style={{ fontFamily: fonts.medium }}>Faculty : </Text>
                                {assignment?.professor || "—"}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-col gap-2">
                        <Text className="text-base text-[#282828]" style={{ fontFamily: fonts.bold }}>
                            Upload your file
                        </Text>

                        {!file ? (
                            <TouchableOpacity
                                onPress={pickDocument}
                                activeOpacity={0.8}
                                className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-6 flex-col items-center justify-center gap-2"
                            >
                                <CloudArrowUp size={40} color="#9CA3AF" />
                                <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: fonts.regular }}>
                                    Drag & Drop your file here or
                                </Text>
                                <View className="bg-white px-3 py-1 rounded-full border border-gray-300">
                                    <Text className="text-xs text-gray-700" style={{ fontFamily: fonts.semiBold }}>
                                        Browse Files
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View className="flex-col gap-2">
                                <View className="flex-row items-center border border-gray-200 rounded-xl p-3 bg-white">
                                    <View className="bg-red-50 rounded-lg p-2 mr-3">
                                        <FilePdf size={24} color="#EF4444" weight="duotone" />
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text numberOfLines={1} className="text-base text-[#282828]" style={{ fontFamily: fonts.medium }}>
                                            {file.name}
                                        </Text>
                                        <Text className="text-xs text-gray-400" style={{ fontFamily: fonts.regular }}>
                                            ({formatBytes(file.size ?? 0)})
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleDeleteFile} disabled={deleting} className="self-start mt-1">
                                    {deleting ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <Text className="text-red-500 text-base underline" style={{ fontFamily: fonts.semiBold }}>
                                            Delete uploaded file
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center mt-6 gap-3">
                        <TouchableOpacity onPress={onClose} className="flex-1 py-2.5 border border-gray-300 bg-white rounded-xl">
                            <Text className="text-center text-base text-gray-600" style={{ fontFamily: fonts.bold }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={uploading || deleting}
                            className="flex-1 py-2.5 bg-[#43C17A] rounded-xl flex-row items-center justify-center shadow-sm"
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-center text-base text-white" style={{ fontFamily: fonts.bold }}>
                                    Upload
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

interface DetailsModalProps {
    visible: boolean;
    onClose: () => void;
    assignment: any;
    onDownloadAttachment: (filePath: string) => void;
}

export function StudentAssignmentDetailsModal({
    visible,
    onClose,
    assignment,
    onDownloadAttachment,
}: DetailsModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center bg-black/40 p-4">
                <TouchableOpacity activeOpacity={1} onPress={onClose} className="absolute inset-0 w-full h-full" />

                <View className="bg-white rounded-2xl w-full max-w-[340px] p-6 shadow-xl flex-col relative">
                    <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 p-1 z-10">
                        <X size={20} color="#000000" weight="bold" />
                    </TouchableOpacity>

                    <View className="flex-col gap-4 mt-2">
                        <View className="flex-row justify-between items-start">
                            <Text className="text-base text-gray-500 w-1/3" style={{ fontFamily: fonts.medium }}>
                                Assignment Title:
                            </Text>
                            <Text className="text-base text-gray-800 flex-1 ml-2" style={{ fontFamily: fonts.regular }}>
                                {assignment?.title || "—"}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-start">
                            <Text className="text-base text-gray-500 w-1/3" style={{ fontFamily: fonts.medium }}>
                                Subject:
                            </Text>
                            <Text className="text-base text-gray-800 flex-1 ml-2" style={{ fontFamily: fonts.regular }}>
                                {assignment?.subjectName || "—"}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-start">
                            <Text className="text-base text-gray-500 w-1/3" style={{ fontFamily: fonts.medium }}>
                                Faculty:
                            </Text>
                            <Text className="text-base text-gray-800 flex-1 ml-2" style={{ fontFamily: fonts.regular }}>
                                {assignment?.professor || "—"}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-start">
                            <Text className="text-base text-gray-500 w-1/3" style={{ fontFamily: fonts.medium }}>
                                Posted on:
                            </Text>
                            <Text className="text-base text-gray-800 flex-1 ml-2" style={{ fontFamily: fonts.regular }}>
                                {assignment?.fromDate || "—"}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-start">
                            <Text className="text-base text-gray-500 w-1/3" style={{ fontFamily: fonts.medium }}>
                                Deadline:
                            </Text>
                            <Text className="text-base text-gray-800 flex-1 ml-2" style={{ fontFamily: fonts.regular }}>
                                {assignment?.toDate || "—"}
                            </Text>
                        </View>

                        <View className="flex-col gap-1 border-t border-gray-100 pt-3">
                            <Text className="text-lg text-[#282828]" style={{ fontFamily: fonts.bold }}>
                                Attachment:
                            </Text>
                            {assignment?.existingFilePath ? (
                                <TouchableOpacity onPress={() => onDownloadAttachment(assignment.existingFilePath)}>
                                    <Text className="text-emerald-600 text-base underline mt-1" style={{ fontFamily: fonts.semiBold }}>
                                        {assignment.existingFilePath.split("/").pop()}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <Text className="text-base text-gray-500 italic mt-1" style={{ fontFamily: fonts.regular }}>
                                    No attachment uploaded
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
