import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from "react-native";
import {
    ArrowSquareDown,
    CheckCircle,
    FilePdf,
    X
} from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { fonts } from "@/constants/fonts";

export type StudentTopicResource = {
    collegeSubjectUnitTopicResourceId: number;
    resourceName: string;
    resourceType?: string;
};

const getStudentTopicResources = async (topicId: number): Promise<StudentTopicResource[]> => {
    return [];
};

type TopicPdfViewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    unitLabel: string;
    unitTitle: string;
    topicTitle: string;
    topicId: number;
};

const useTranslations = (namespace: string) => {
    return (key: string) => {
        if (key === "Downloading") return "Downloading";
        if (key === "Close") return "Close";
        if (key === "Download File") return "Download File";
        if (key === "Select File(s)") return "Select File(s)";
        return key;
    };
};

function ModalShimmer() {
    return (
        <View className="flex-col flex-1 opacity-60">
            <View className="flex-col gap-4 p-5 flex-1">
                <View className="space-y-2 pr-6">
                    <View className="h-5 w-3/4 rounded bg-gray-200" />
                    <View className="h-4 w-1/2 rounded bg-gray-100" />
                </View>

                <View className="flex-col gap-2 mt-4">
                    <View className="h-4 w-24 rounded bg-gray-200 mb-1" />
                    {Array.from({ length: 3 }).map((_, index) => (
                        <View
                            key={`student-resource-shimmer-${index}`}
                            className="flex-row items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                        >
                            <View className="flex-row items-center gap-3 flex-1">
                                <View className="h-9 w-9 rounded-lg bg-gray-200" />
                                <View className="flex-1 gap-1">
                                    <View className="h-3.5 w-3/4 rounded bg-gray-200" />
                                    <View className="h-2.5 w-1/3 rounded bg-gray-100" />
                                </View>
                            </View>
                            <View className="h-7 w-16 rounded-lg bg-gray-200" />
                        </View>
                    ))}
                </View>
            </View>

            <View className="flex-row gap-3 px-5 pb-5 pt-3 border-t border-gray-100">
                <View className="h-10 flex-1 rounded-lg bg-gray-200" />
            </View>
        </View>
    );
}

export function TopicPdfViewModal({
    isOpen,
    onClose,
    unitLabel,
    unitTitle,
    topicTitle,
    topicId,
}: TopicPdfViewModalProps) {
    const t = useTranslations("Academics.student");
    const [resources, setResources] = useState<StudentTopicResource[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);

    useEffect(() => {
        if (!isOpen || !topicId) return;
        let cancelled = false;

        async function loadResources() {
            setLoadingResources(true);
            try {
                const data = await getStudentTopicResources(topicId);
                if (!cancelled) {
                    setResources(data);
                    setSelectedResourceIds(
                        data.length > 0 ? [data[0].collegeSubjectUnitTopicResourceId] : [],
                    );
                }
            } catch (err: any) {
                if (!cancelled) {
                    Alert.alert("Error", err?.message ?? "Failed to load PDFs");
                }
            } finally {
                if (!cancelled) {
                    setLoadingResources(false);
                }
            }
        }

        loadResources();

        return () => {
            cancelled = true;
        };
    }, [isOpen, topicId]);

    useEffect(() => {
        if (!isOpen) {
            setResources([]);
            setDownloadingId(null);
            setSelectedResourceIds([]);
        }
    }, [isOpen]);

    const toggleSelectedResource = (resourceId: number) => {
        setSelectedResourceIds((prev) =>
            prev.includes(resourceId)
                ? prev.filter((id) => id !== resourceId)
                : [...prev, resourceId],
        );
    };

    const handleDownload = async (resource: StudentTopicResource) => {
        try {
            setDownloadingId(resource.collegeSubjectUnitTopicResourceId);

            const endpoint = `/api/student/topic-resources?resourceId=${resource.collegeSubjectUnitTopicResourceId}&download=1`;

            await new Promise((resolve) => setTimeout(resolve, 1500));

            Toast.show({
                type: 'success',
                text1: 'Download Complete',
                text2: `${resource.resourceName} has been downloaded successfully!`,
                position: 'top',
                visibilityTime: 3000,
            });

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Download Failed',
                text2: error?.message || 'Failed to download file',
                position: 'top',
                visibilityTime: 4000,
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const selectedResources = resources.filter((resource) =>
        selectedResourceIds.includes(resource.collegeSubjectUnitTopicResourceId),
    );

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                className="flex-1 bg-black/40 justify-center items-center px-4"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
                <View className="bg-white rounded-2xl w-full max-w-sm flex-col max-h-[80%] relative overflow-hidden shadow-xl">

                    <TouchableOpacity
                        onPress={onClose}
                        className="absolute top-4 right-4 z-10 p-1"
                    >
                        <X size={20} color="#9CA3AF" weight="bold" />
                    </TouchableOpacity>

                    {loadingResources ? (
                        <ModalShimmer />
                    ) : (
                        <>
                            <ScrollView className="p-5 flex-col" showsVerticalScrollIndicator={false}>
                                <Text className="text-base text-gray-800 mb-4 pr-6 flex-row flex-wrap" style={{ fontFamily: fonts.bold }}>
                                    <Text className="text-[#7E5DFF]">{unitLabel}</Text>
                                    <Text className="text-gray-400"> → </Text>
                                    <Text className="text-gray-600">{unitTitle}</Text>
                                    <Text className="text-gray-400"> → </Text>
                                    <Text className="text-gray-600">{topicTitle}</Text>
                                </Text>

                                <View className="flex-col gap-2 mb-4">
                                    <Text className="text-xs text-gray-700 uppercase tracking-wider mb-1" style={{ fontFamily: fonts.semiBold }}>
                                        {t("Uploaded PDFs")}
                                    </Text>

                                    {resources.length > 0 ? (
                                        resources.map((resource) => {
                                            const isDownloading = downloadingId === resource.collegeSubjectUnitTopicResourceId;
                                            const isSelected = selectedResourceIds.includes(resource.collegeSubjectUnitTopicResourceId);

                                            return (
                                                <TouchableOpacity
                                                    key={resource.collegeSubjectUnitTopicResourceId}
                                                    onPress={() => toggleSelectedResource(resource.collegeSubjectUnitTopicResourceId)}
                                                    className={`flex-row items-center justify-between gap-3 rounded-xl px-3 py-2.5 border my-1 ${isSelected ? "bg-[#F0FBF5] border-[#43C17A]" : "bg-gray-50 border-gray-100"
                                                        }`}
                                                >
                                                    <View className="flex-row items-center gap-3 flex-1">
                                                        <CheckCircle
                                                            size={18}
                                                            color={isSelected ? "#43C17A" : "#D1D5DB"}
                                                            weight={isSelected ? "fill" : "regular"}
                                                        />
                                                        <View className="bg-red-100 rounded-lg p-1.5">
                                                            <FilePdf size={18} color="#EF4444" weight="duotone" />
                                                        </View>
                                                        <View className="flex-1">
                                                            <Text className="text-xs text-gray-700" numberOfLines={1} style={{ fontFamily: fonts.semiBold }}>
                                                                {resource.resourceName}
                                                            </Text>
                                                            <Text className="text-[10px] text-gray-400 capitalize" style={{ fontFamily: fonts.regular }}>
                                                                {resource.resourceType ?? "PDF"}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {isDownloading && isSelected && (
                                                        <View className="flex-row items-center gap-1">
                                                            <ActivityIndicator size="small" color="#43C17A" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })
                                    ) : (
                                        <View className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 items-center justify-center">
                                            <Text className="text-sm text-gray-400 text-center" style={{ fontFamily: fonts.medium }}>
                                                {t("No PDFs uploaded for this topic yet")}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>

                            <View className="flex-row gap-2 px-5 pb-5 pt-3 border-t border-gray-100 bg-white">
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 items-center justify-center"
                                >
                                    <Text className="text-sm text-gray-600" style={{ fontFamily: fonts.bold }}>{t("Close")}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={async () => {
                                        for (const resource of selectedResources) {
                                            await handleDownload(resource);
                                        }
                                    }}
                                    disabled={selectedResources.length === 0 || downloadingId !== null}
                                    className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-2 ${selectedResources.length === 0 || downloadingId !== null
                                        ? "bg-[#43C17A]/50"
                                        : "bg-[#43C17A]"
                                        }`}
                                >
                                    {downloadingId !== null ? (
                                        <>
                                            <ActivityIndicator size="small" color="white" />
                                            <Text className="text-sm text-white" style={{ fontFamily: fonts.bold }}>{t("Downloading")}...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowSquareDown size={14} color="white" />
                                            <Text className="text-sm text-white" style={{ fontFamily: fonts.bold }}>
                                                {selectedResources.length > 0
                                                    ? `${t("Download File")}${selectedResources.length > 1 ? "s" : ""}`
                                                    : t("Select File(s)")}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}