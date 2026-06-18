import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Linking } from 'react-native';
import tw from "twrnc";
import { fetchProjectSubmissionsWithStudents } from "@/lib/helpers/student/student_project_submissionsAPI";
import { useSafeAreaInsets } from "react-native-safe-area-context";
interface StudentSubmissionsProps {
  projectId: number;
  projectTitle: string;
}
export default function StudentSubmissions({
  projectId,
  projectTitle
}: StudentSubmissionsProps) {
  const {
    t
  } = useTranslation();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const getSubmissions = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await fetchProjectSubmissionsWithStudents(projectId);
        const formattedData = data.map((item: any, index: number) => {
          const student = item.students;
          const user = student?.users;
          const profileData = student?.users?.user_profile;
          const profileUrl = Array.isArray(profileData) ? profileData[0]?.profileUrl : profileData?.profileUrl;
          const rollData = student?.student_pins;
          const pinNumber = Array.isArray(rollData) ? rollData[0]?.pinNumber : rollData?.pinNumber;
          return {
            id: item.submissionId || index,
            sno: index + 1,
            photo: profileUrl,
            name: user?.fullName || "Unknown Student",
            rollNo: pinNumber || "N/A",
            date: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "N/A",
            fileUrl: item.fileUrl
          };
        });
        setSubmissions(formattedData);
      } catch (err) {
        console.error("Failed to load submissions", err);
      } finally {
        setIsLoading(false);
      }
    };
    getSubmissions();
  }, [projectId]);
  return <View style={tw`flex-1 p-4`}>
            <View style={tw`mb-4`}>
                <Text style={tw`text-[#16a34a] text-xl font-bold`}>{projectTitle}</Text>
                <Text style={tw`text-gray-500 text-sm mt-1`}>{submissions.length}{t("Auto.Common.TotalSubmission", "Total Submissions")}</Text>
            </View>

            {isLoading ? <View style={tw`flex-1 justify-center items-center py-10`}>
                    <ActivityIndicator size="large" color="#16a34a" />
                </View> : submissions.length === 0 ? <View style={tw`flex-1 justify-center items-center py-10`}>
                    <Text style={tw`text-gray-500`}>{t("Auto.Common.Nosubmissionsfo", "No submissions found.")}</Text>
                </View> : <ScrollView style={tw`flex-1`}>
                    {submissions.map(sub => {
        const {
          t
        } = useTranslation();
        return <View key={sub.id} style={tw`flex-row items-center justify-between p-4 bg-white rounded-xl shadow-sm mb-3 border border-gray-100`}>
                            <View style={tw`flex-row items-center flex-1`}>
                                <Image source={{
              uri: sub.photo || "https://ui-avatars.com/api/?name=Student"
            }} style={tw`w-12 h-12 rounded-full mr-3 bg-gray-200`} />
            
                                <View style={tw`flex-1 pr-2`}>
                                    <Text style={tw`text-base font-semibold text-gray-900`} numberOfLines={1}>{sub.name}</Text>
                                    <Text style={tw`text-xs text-gray-500 mt-0.5`}>{sub.rollNo}</Text>
                                    <Text style={tw`text-xs text-gray-400 mt-0.5`}>{t("Auto.Common.Submitted", "Submitted:")}{sub.date}</Text>
                                </View>
                            </View>
                            {sub.fileUrl && <TouchableOpacity style={tw`bg-green-50 px-3 py-1.5 rounded-full border border-green-200`} onPress={() => Linking.openURL(sub.fileUrl)}>
            
                                    <Text style={tw`text-green-700 text-sm font-semibold`}>{t("Auto.Common.ViewFile", "View File")}</Text>
                                </TouchableOpacity>}
                        </View>;
      })}
                </ScrollView>}
        </View>;
}