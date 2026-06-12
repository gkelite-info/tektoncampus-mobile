import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Platform,
    Linking,
    PermissionsAndroid,
} from "react-native";
import {
    CalendarDots,
    LinkSimpleHorizontal,
    UserCircle,
    CaretDown,
    DownloadSimple,
    PencilSimple,
} from "phosphor-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { useStudent } from "@/utils/context/student/useStudent";
import { supabase } from "@/lib/supabaseClient";
import { fonts } from "@/constants/fonts";
import {
    StudentAssignmentUploadModal,
    StudentAssignmentDetailsModal,
} from "./studentAssignmentModals";

export type CardProp = {
    assignmentId: number | string;
    image: any;
    title: string;
    studentId: number;
    subjectName?: string;
    topicName: string;
    description: string;
    fromDate: string;
    toDate: string;
    professor: string;
    videoLink: string;
    marksScored?: number | null;
    marksTotal?: number;
    assignmentTitle?: string;
    existingFilePath?: string | null;
};

type AssignmentCardProps = {
    cardProp: CardProp[];
    activeView: "active" | "previous";
};

const useTranslations = (namespace: string) => {
    return (key: string, variables?: Record<string, string>) => {
        if (variables?.date) return key.replace("{date}", variables.date);
        return key;
    };
};

async function requestStoragePermission() {
    if (Platform.OS !== "android") return true;
    try {
        if (Number(Platform.Version) >= 33) {
            return true;
        }
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
                title: "Storage Permission Required",
                message: "This app needs access to your storage to download assignment files.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK",
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        console.warn(err);
        return false;
    }
}

export default function AssignmentCardMobile({
    cardProp,
    activeView,
}: AssignmentCardProps) {
    const t = useTranslations("Assignment.student");
    const { studentId } = useStudent();
    const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: string }>({});
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CardProp | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    useEffect(() => {
        const map: { [key: number]: string } = {};
        cardProp.forEach((item, idx) => {
            if (item.existingFilePath) map[idx] = item.existingFilePath;
        });
        setUploadedFiles((prev) => ({ ...prev, ...map }));
    }, [cardProp]);

    const openModal = (item: CardProp) => {
        setSelectedCard(item);
        setShowModal(true);
        console.log("Opening details for:", item.title);
    };

    const openUploadModal = (index: number) => {
        setUploadingIndex(index);
        setShowUploadModal(true);
        console.log("Opening upload sheet for index:", index);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setUploadingIndex(index);
        setShowUploadModal(true);
        console.log("Editing upload for index:", index);
    };

    const handleDownload = async (index: number, item: CardProp) => {
        const storedPath = item.existingFilePath ?? uploadedFiles[index];
        if (!storedPath) {
            Toast.show({ type: "error", text1: "No uploaded file found" });
            return;
        }

        try {
            Toast.show({ type: "info", text1: "Downloading file..." });

            const { data, error: signedUrlError } = await supabase.storage
                .from("student_submissions")
                .createSignedUrl(storedPath, 3600);

            if (signedUrlError || !data?.signedUrl) {
                console.error("Signed URL error:", signedUrlError);
                Toast.show({ type: "error", text1: "Failed to generate download URL" });
                return;
            }

            const downloadUrl = data.signedUrl;
            const fileName = storedPath.split("/").pop() || "assignment.pdf";

            if (Platform.OS === "android") {
                const hasPermission = await requestStoragePermission();
                if (!hasPermission) {
                    Toast.show({ type: "error", text1: "Storage permission denied" });
                    return;
                }

                const publicDownloadUri = `file:///storage/emulated/0/Download/${fileName}`;
                try {
                    await FileSystem.downloadAsync(downloadUrl, publicDownloadUri);
                    Toast.show({ type: "success", text1: "File downloaded to Downloads folder!" });
                    return;
                } catch (androidError) {
                    console.log("Direct download to Downloads failed, falling back:", androidError);
                }
            }

            const localUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.downloadAsync(downloadUrl, localUri);

            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(localUri);
                Toast.show({ type: "success", text1: "File downloaded successfully!" });
            } else {
                Toast.show({ type: "error", text1: "Sharing not available on this device" });
            }
        } catch (error) {
            console.error("Download failed:", error);
            Toast.show({ type: "error", text1: "Failed to download file" });
        }
    };

    const downloadFileFromPath = (filePath: string) => {
        handleDownload(0, { existingFilePath: filePath } as any);
    };

    return (
        <View className="w-full px-1">
            {cardProp.map((item, index) => {
                const isExpanded = expandedIndex === index;

                return (
                    <View
                        key={index}
                        className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm w-full"
                    >
                        <View className="flex-row gap-3">
                            <View className="w-[75px] h-[75px] rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                                <Image
                                    source={typeof item.image === "number" ? item.image : { uri: item.image }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </View>

                            <View className="flex-1 min-w-0 justify-center">
                                <View className="flex-row justify-between items-start w-full">
                                    <View className="flex-1 min-w-0 pr-2">
                                        <Text
                                            className="text-[#282828] text-base leading-tight"
                                            numberOfLines={1}
                                            style={{ fontFamily: fonts.bold }}
                                        >
                                            {item.subjectName || "Subject"}
                                        </Text>
                                        <Text
                                            className="text-gray-800 text-sm mt-0.5 leading-snug"
                                            numberOfLines={1}
                                            style={{ fontFamily: fonts.medium }}
                                        >
                                            {item.title}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center gap-2 shrink-0">
                                        <TouchableOpacity
                                            onPress={() => handleDownload(index, item)}
                                            activeOpacity={0.7}
                                            className="w-6 h-6 rounded-full border border-[#43C17A] items-center justify-center text-[#43C17A]"
                                        >
                                            <DownloadSimple size={12} color="#43C17A" weight="bold" />
                                        </TouchableOpacity>

                                        {activeView === "active" && (
                                            <TouchableOpacity
                                                onPress={() => handleEdit(index)}
                                                activeOpacity={0.7}
                                                className="w-6 h-6 rounded-full border border-[#43C17A] items-center justify-center text-[#43C17A]"
                                            >
                                                <PencilSimple size={12} color="#43C17A" weight="bold" />
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            onPress={() => setExpandedIndex(isExpanded ? null : index)}
                                            activeOpacity={0.7}
                                            className="w-6 h-6 rounded-full bg-[#43C17A] items-center justify-center shadow-xs"
                                        >
                                            <View
                                                style={{
                                                    transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                                                }}
                                            >
                                                <CaretDown size={12} color="white" weight="bold" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text
                                    className="text-gray-500 text-xs mt-1"
                                    numberOfLines={1}
                                >
                                    {item.description}
                                </Text>
                            </View>
                        </View>

                        <View className="mt-4 pt-3 border-t border-gray-50 flex-row justify-between items-center w-full">
                            {activeView === "active" ? (
                                <View>
                                    {uploadedFiles[index] ? (
                                        <View className="bg-[#E2F3E9] px-3 py-1 rounded-full border border-[#43C17A]/20">
                                            <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.bold }}>
                                                {t("Uploaded")}
                                            </Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => openUploadModal(index)}
                                            activeOpacity={0.7}
                                            className="bg-[#E2F3E9] px-3 py-1 rounded-full border border-[#43C17A]/20"
                                        >
                                            <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.bold }}>
                                                {t("Upload")} +
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-1.5">
                                    <Text className="text-[11px] text-gray-500 font-medium">
                                        Marks :
                                    </Text>
                                    <View className="bg-[#16284F] px-2.5 py-0.5 rounded-full">
                                        <Text className="text-white text-[11px] font-bold">
                                            {item.marksScored ?? "-"}/{item.marksTotal ?? "-"}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity onPress={() => openModal(item)} activeOpacity={0.6}>
                                <Text className="text-[#43C17A] text-base" style={{ fontFamily: fonts.semiBold }}>
                                    {t("View Details")}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isExpanded && (
                            <View className="mt-3 border-t border-gray-100 pt-3 flex-col gap-2 w-full">
                                <View className="flex-row items-center gap-2">
                                    <CalendarDots size={14} color="#43C17A" weight="bold" />
                                    <Text className="text-gray-600 text-sm flex-1" numberOfLines={1} style={{ fontFamily: fonts.medium }}>
                                        {item.fromDate} - {item.toDate}
                                    </Text>
                                </View>

                                <View className="flex-row items-center gap-2">
                                    <UserCircle size={14} color="#43C17A" weight="bold" />
                                    <Text className="text-gray-600 text-sm flex-1" numberOfLines={1} style={{ fontFamily: fonts.regular }}>
                                        {item.professor}
                                    </Text>
                                </View>

                                {(item.videoLink || uploadedFiles[index]) && (
                                    <View className="flex-row items-center gap-2 mt-0.5">
                                        <LinkSimpleHorizontal size={14} color="#43C17A" weight="bold" />
                                        {uploadedFiles[index] ? (
                                            <TouchableOpacity
                                                onPress={() => downloadFileFromPath(uploadedFiles[index])}
                                                activeOpacity={0.7}
                                                className="flex-1"
                                            >
                                                <Text
                                                    className="text-emerald-600 text-sm underline font-medium"
                                                    numberOfLines={1}
                                                >
                                                    {uploadedFiles[index].split("/").pop()}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text
                                                className="text-gray-600 text-xs flex-1"
                                                numberOfLines={1}
                                            >
                                                {item.videoLink || "Resource Link"}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}

            {showModal && selectedCard && (
                <StudentAssignmentDetailsModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    assignment={selectedCard}
                    onDownloadAttachment={(filePath) => downloadFileFromPath(filePath)}
                />
            )}

            {showUploadModal && uploadingIndex !== null && studentId && (
                <StudentAssignmentUploadModal
                    visible={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setUploadingIndex(null);
                    }}
                    assignment={cardProp[uploadingIndex]}
                    studentId={studentId}
                    existingFilePath={uploadedFiles[uploadingIndex] || null}
                    onUploadSuccess={(newPath) => {
                        setUploadedFiles((prev) => {
                            const copy = { ...prev };
                            if (newPath) {
                                copy[uploadingIndex] = newPath;
                            } else {
                                delete copy[uploadingIndex];
                            }
                            return copy;
                        });
                    }}
                />
            )}
        </View>
    );
}