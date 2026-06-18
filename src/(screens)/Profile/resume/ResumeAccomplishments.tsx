import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";
import { getAwards, deleteAward } from "../../../lib/helpers/resume/resumeAwardsAPI";
import { getCertifications, deleteCertification } from "../../../lib/helpers/resume/resumeCertificationsAPI";
import { getClubs, deleteClub } from "../../../lib/helpers/resume/resumeClubsAPI";
export default function ResumeAccomplishments() {
  const {
    t
  } = useTranslation();
  const {
    studentId
  } = useUser();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [awards, setAwards] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);
  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const [awData, cData, clData] = await Promise.all([getAwards(studentId!), getCertifications(studentId!), getClubs(studentId!)]);
      setAwards(awData);
      setCerts(cData);
      setClubs(clData);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to load accomplishments"
      });
    } finally {
      setIsPageLoading(false);
    }
  };
  const handleDelete = async (type: string, id: number, apiCall: Function) => {
    Alert.alert("Delete", `Are you sure you want to delete this ${type}?`, [{
      text: "Cancel",
      style: "cancel"
    }, {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await apiCall(id);
          Toast.show({
            type: "success",
            text1: "Deleted successfully"
          });
          loadData();
        } catch (e) {
          Toast.show({
            type: "error",
            text1: "Failed to delete"
          });
        }
      }
    }]);
  };
  if (isPageLoading) {
    return <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadingaccompli", "Loading accomplishments...")}</Text>
            </View>;
  }
  return <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.Accomplishments", "Accomplishments")}</Text>
                </View>

                {}
                <View className="mb-8">
                    <Text className="text-md font-semibold text-[#43C17A] mb-3">{t("Auto.Common.Awards", "Awards")}</Text>
                    {awards.map(aw => {
          const {
            t
          } = useTranslation();
          return <View key={aw.awardId} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 flex-row justify-between items-start">
                            <View className="flex-1">
                                <Text className="font-medium text-gray-800">{aw.awardName}</Text>
                                <Text className="text-sm text-gray-500">{aw.issuedBy} - {aw.dateReceived}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete("Award", aw.awardId, deleteAward)}>
                                <Text className="text-red-500">{t("Auto.Common.Delete", "Delete")}</Text>
                            </TouchableOpacity>
                        </View>;
        })}
                    <TouchableOpacity className="mt-2">
                        <Text className="text-[#43C17A] font-medium">{t("Auto.Common.AddAwardWebonly", "+ Add Award (Web only for now)")}</Text>
                    </TouchableOpacity>
                </View>

                {}
                <View className="mb-8">
                    <Text className="text-md font-semibold text-[#43C17A] mb-3">{t("Auto.Common.Certifications", "Certifications")}</Text>
                    {certs.map(cert => {
          const {
            t
          } = useTranslation();
          return <View key={cert.certificationId} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 flex-row justify-between items-start">
                            <View className="flex-1">
                                <Text className="font-medium text-gray-800">{cert.certificationName}</Text>
                                <Text className="text-sm text-gray-500">{t("Auto.Common.ID", "ID:")}{cert.certificationCompletionId}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete("Certification", cert.certificationId, deleteCertification)}>
                                <Text className="text-red-500">{t("Auto.Common.Delete", "Delete")}</Text>
                            </TouchableOpacity>
                        </View>;
        })}
                    <TouchableOpacity className="mt-2">
                        <Text className="text-[#43C17A] font-medium">{t("Auto.Common.AddCertificatio", "+ Add Certification (Web only for now)")}</Text>
                    </TouchableOpacity>
                </View>

                {}
                <View className="mb-4">
                    <Text className="text-md font-semibold text-[#43C17A] mb-3">{t("Auto.Common.ClubsCommittees", "Clubs & Committees")}</Text>
                    {clubs.map(club => {
          const {
            t
          } = useTranslation();
          return <View key={club.resumeClubCommitteeId} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 flex-row justify-between items-start">
                            <View className="flex-1">
                                <Text className="font-medium text-gray-800">{club.clubName}</Text>
                                <Text className="text-sm text-gray-500">{club.role}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete("Club", club.resumeClubCommitteeId, deleteClub)}>
                                <Text className="text-red-500">{t("Auto.Common.Delete", "Delete")}</Text>
                            </TouchableOpacity>
                        </View>;
        })}
                    <TouchableOpacity className="mt-2">
                        <Text className="text-[#43C17A] font-medium">{t("Auto.Common.AddClubWebonlyf", "+ Add Club (Web only for now)")}</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>;
}