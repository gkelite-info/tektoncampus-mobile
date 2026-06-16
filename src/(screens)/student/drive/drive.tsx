import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Folder, FileText, DownloadSimple, CaretDown, CaretUp } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function DriveScreen() {
    const headerHeight = useHeaderHeight();
    const [openFolder, setOpenFolder] = useState<number | null>(1); 

    const storageUsage = {
        used: "1.2 GB",
        total: "15 GB",
        percent: 8,
    };

    const folders = [
        {
            id: 1,
            name: "Lecture Notes",
            filesCount: 3,
            files: [
                { name: "Unit_1_Software_Architecture.pdf", size: "2.4 MB", type: "PDF" },
                { name: "Unit_2_Design_Patterns.pdf", size: "3.1 MB", type: "PDF" },
                { name: "Cloud_Deployment_Slides.pdf", size: "4.8 MB", type: "PDF" },
            ],
        },
        {
            id: 2,
            name: "Previous Year Question Papers",
            filesCount: 2,
            files: [
                { name: "DBMS_EndSemester_2025.pdf", size: "1.2 MB", type: "PDF" },
                { name: "Machine_Learning_Midsem_2025.pdf", size: "850 KB", type: "PDF" },
            ],
        },
        {
            id: 3,
            name: "Lab Manuals",
            filesCount: 2,
            files: [
                { name: "Java_Programming_Lab_Manual.pdf", size: "1.8 MB", type: "PDF" },
                { name: "Web_Technologies_Lab_Exercises.pdf", size: "2.1 MB", type: "PDF" },
            ],
        },
    ];

    const toggleFolder = (id: number) => {
        if (openFolder === id) {
            setOpenFolder(null);
        } else {
            setOpenFolder(id);
        }
    };

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingTop: headerHeight + 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {}
                <View className="mb-6">
                    <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>
                        Resource Drive
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Access syllabus materials, note handouts, and question banks
                    </Text>
                </View>

                {}
                <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-slate-500 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>Cloud Storage</Text>
                        <Text className="text-slate-700 text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                            {storageUsage.used} of {storageUsage.total} used
                        </Text>
                    </View>
                    <View className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <View className="h-full bg-emerald-500 rounded-full" style={{ width: `${storageUsage.percent}%` }} />
                    </View>
                </View>

                {}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-4" style={{ fontFamily: fonts.bold }}>
                        Academic Folders
                    </Text>

                    {folders.map((folder) => {
                        const isOpen = openFolder === folder.id;

                        return (
                            <View key={folder.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden">
                                {}
                                <TouchableOpacity 
                                    onPress={() => toggleFolder(folder.id)}
                                    activeOpacity={0.8}
                                    className="flex-row items-center justify-between p-4"
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                                            <Folder size={22} color="#D97706" weight="fill" />
                                        </View>
                                        <View>
                                            <Text className="text-[#1E293B] text-[14px]" style={{ fontFamily: fonts.semiBold }}>
                                                {folder.name}
                                            </Text>
                                            <Text className="text-slate-400 text-[10px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                                {folder.filesCount} items
                                            </Text>
                                        </View>
                                    </View>
                                    {isOpen ? (
                                        <CaretUp size={18} color="#64748B" />
                                    ) : (
                                        <CaretDown size={18} color="#64748B" />
                                    )}
                                </TouchableOpacity>

                                {}
                                {isOpen && (
                                    <View className="bg-slate-50/50 border-t border-slate-100 p-3">
                                        {folder.files.map((file, fid) => (
                                            <View key={fid} className="flex-row items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-100 mb-2">
                                                <View className="flex-row items-center flex-1 mr-3">
                                                    <FileText size={18} color="#43C17A" />
                                                    <View className="flex-1 ml-2.5">
                                                        <Text className="text-[#334155] text-xs" numberOfLines={1} style={{ fontFamily: fonts.medium }}>
                                                            {file.name}
                                                        </Text>
                                                        <Text className="text-slate-400 text-[9px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                                            {file.size} · {file.type}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity className="p-1.5 rounded-lg bg-emerald-50">
                                                    <DownloadSimple size={16} color="#10B981" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
