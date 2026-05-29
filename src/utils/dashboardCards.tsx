import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { CaretRight, Plus, User } from "phosphor-react-native";

export const UserInfoCard = ({ cardProps }: any) => {
    const item = cardProps?.[0] || {};
    return (
        <View className="w-full bg-[#e3f4ea] rounded-2xl h-40 shadow-sm flex-row overflow-hidden relative mb-4">
            <View className="flex-1 p-4 justify-center z-10">
                <Text className="text-gray-700 text-sm mb-1 font-medium">Welcome Back,</Text>
                <View className="flex-row items-center flex-wrap mb-1">
                    <Text className="text-[#089144] font-bold text-lg mr-1">
                        Prof. {item.user || "Sai Saraswathi"}
                    </Text>
                </View>
                <Text className="text-gray-600 text-xs mb-3 font-medium">
                    {item.facultySubject || "(Engineering Chemistry)"}
                </Text>
                <Text className="text-gray-600 text-xs font-medium">
                    Your Students Completed <Text className="text-[#089144] font-bold">{item.studentsTaskPercentage || 0}%</Text> of the tasks.
                </Text>
            </View>
            
            <View className="absolute right-0 bottom-0 h-full w-[150px] bg-[#BCE6D0] rounded-tl-full opacity-60" />
            
            <View className="absolute right-2 bottom-0 h-[110%] w-[120px] justify-end z-20">
                <View className="w-full h-[90%] bg-transparent items-center justify-end">
                     <Image 
                        source={item.image || { uri: 'https://cdn3d.iconscout.com/3d/premium/thumb/teacher-3d-illustration-download-in-png-blend-fbx-gltf-formats--educator-professor-tutor-school-pack-profession-illustrations-5712175.png?f=webp' }}
                        style={{ height: 130, resizeMode: 'contain', bottom: 0 }}
                     />
                </View>
            </View>
        </View>
    );
};


export const CardComponent = ({ style, icon, value, label }: any) => (
    <View className={`rounded-xl p-3 h-24 ${style} flex-row items-center shadow-sm w-full border border-gray-100/50`}>
        <View className="w-12 h-12 bg-white rounded-lg items-center justify-center shadow-sm mr-3">
            {icon}
        </View>
        <View className="flex-1 justify-center">
            <Text className="text-[16px] font-bold text-gray-900 leading-tight mb-1">{value}</Text>
            <Text className="text-[11px] text-gray-500 font-medium leading-tight">{label}</Text>
        </View>
    </View>
);

export const StudentPerformanceCard = ({ students }: any) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm w-full mb-4">
        <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[15px] font-bold text-gray-900">
                My Students Performance
            </Text>
            <TouchableOpacity>
                <CaretRight weight="bold" size={16} color="#6B7280" />
            </TouchableOpacity>
        </View>

        <View className="flex-col pr-1">
            {students.slice(0, 6).map((student: any, index: number) => (
                <View key={student.id || index} className="flex-row items-center py-2.5 border-b border-gray-50">
                    <View className="w-8 h-8 rounded-full bg-[#E5E7EB] border border-[#43C17A] items-center justify-center mr-3">
                        <User size={16} color="#9CA3AF" weight="fill" />
                    </View>
                    
                    <Text className="flex-1 font-medium text-gray-800 text-xs">
                        Student {index + 1}
                    </Text>
                    
                    <View className="flex-row items-center ml-2 w-28">
                        <View className="h-1.5 bg-[#16284F] rounded-full flex-1 overflow-hidden mr-2">
                            <View 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${student.percentage || 0}%` }}
                            />
                        </View>
                        <Text className="text-gray-700 font-medium text-[10px] w-6 text-right">
                            {student.percentage || 0}%
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    </View>
);

const LessonCard = ({ lesson }: { lesson: any }) => (
    <View
        className={`relative flex-row rounded-r-xl rounded-l overflow-hidden min-h-[100px] mb-3 border border-gray-100/50 ${
            lesson.sessionStatus === "Cancel" ? "bg-red-50/50" : "bg-[#eff2f7]"
        }`}
    >
        <View
            className={`w-1.5 absolute left-0 top-0 bottom-0 rounded-l-sm ${
                lesson.sessionStatus === "Cancel"
                    ? "bg-red-400"
                    : lesson.sessionStatus === "Accepted"
                    ? "bg-emerald-400"
                    : "bg-[#1e2952]"
            }`}
        />
        <View className="flex-1 py-3 px-4 ml-2 flex-col justify-between">
            <View>
                <View className="flex-row justify-between items-start gap-2">
                    <Text className="text-[#1e2952] font-bold text-[14px] leading-tight flex-1">
                        {lesson.title}
                    </Text>
                    {lesson.sessionStatus === "Accepted" && (
                        <View className="bg-emerald-100 px-2 py-0.5 rounded-md">
                            <Text className="text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                                Accepted
                            </Text>
                        </View>
                    )}
                    {lesson.sessionStatus === "Cancel" && (
                        <View className="bg-red-100 px-2 py-0.5 rounded-md">
                            <Text className="text-red-700 text-[9px] font-bold uppercase tracking-wider">
                                Cancelled
                            </Text>
                        </View>
                    )}
                </View>
                <Text className="text-[#1e2952] font-bold text-[11px] leading-tight mt-1">
                    {lesson.degree}{" "}
                    {lesson.department?.map((item: any) => item.name).join(", ")} - Year{" "}
                    {lesson.year} {lesson.section && ` - Section ${lesson.section}`}
                </Text>
                <Text className="text-gray-600 text-[12px] mt-1 leading-snug" numberOfLines={2}>
                    {lesson.description}
                </Text>
            </View>
            <View className="flex-row justify-end mt-2">
                <Text className="text-emerald-500 text-xs font-semibold">
                    {lesson.fromTime}
                </Text>
            </View>
        </View>
    </View>
);

import { ActivityIndicator } from "react-native";

export const UpcomingClasses = ({ lessons, onAddLesson, facultyId, loading }: any) => {
    const displayLessons = lessons || [];
    return (
        <View className="bg-white rounded-2xl p-4 shadow-sm w-full mb-4">
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[15px] font-bold text-gray-900">
                    Upcoming Classes
                </Text>
                <TouchableOpacity className="w-7 h-7 bg-gray-100 rounded-full items-center justify-center" onPress={onAddLesson}>
                    <Plus weight="bold" size={14} color="#374151" />
                </TouchableOpacity>
            </View>
            
            {loading ? (
                <View className="py-6 items-center justify-center">
                    <ActivityIndicator size="small" color="#089144" />
                </View>
            ) : (
                <View className="flex-col">
                    {displayLessons.map((lesson: any, index: number) => (
                        <LessonCard key={lesson.id || index} lesson={lesson} />
                    ))}
                    {displayLessons.length === 0 && (
                        <View className="py-6 items-center justify-center">
                            <Text className="text-gray-400 text-sm italic">No upcoming classes scheduled.</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export const AnnouncementsCard = () => <View />;
export const CourseScheduleCard = () => <View />;
export const TaskPanel = () => <View />;
export const WorkWeekCalendar = () => <View />;
export const TaskModal = () => null;
