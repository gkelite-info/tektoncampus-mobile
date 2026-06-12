import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import tw from "twrnc";
import Toast from "react-native-toast-message";
import { getAllClubsAPI } from "@/lib/helpers/clubActivity/adminClubsAPI";
import { joinClubAPI, getStudentClubStatusAPI } from "@/lib/helpers/clubActivity/studentClubAPI";
import { useUser } from "@/utils/context/UserContext";
import { Avatar } from "@/components/Avatar";
import { useTranslation } from "react-i18next";

interface AllClubsGridProps {
    onNavigateMyClub: () => void;
}

export default function AllClubsGrid({ onNavigateMyClub }: AllClubsGridProps) {
    const { collegeId, studentId } = useUser(); 
    const { t } = useTranslation();

    const [clubs, setClubs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 15;

    const [joiningClubId, setJoiningClubId] = useState<string | null>(null);
    const [activeClubId, setActiveClubId] = useState<string | null>(null);
    const [activeClubStatus, setActiveClubStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!collegeId || !studentId) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const clubsPromise = getAllClubsAPI(parseInt(collegeId.toString(), 10), currentPage, ITEMS_PER_PAGE);
                let statusPromise = Promise.resolve({ requestedClubId: null, status: null });
                if (studentId) {
                    statusPromise = getStudentClubStatusAPI(parseInt(studentId.toString(), 10));
                }
                const [response, statusRes] = await Promise.all([clubsPromise, statusPromise]);
                setClubs(response.data);
                setTotalItems(response.total);

                if (statusRes.requestedClubId) {
                    setActiveClubId(statusRes.requestedClubId);
                    setActiveClubStatus(statusRes.status);
                } else {
                    setActiveClubId(null);
                    setActiveClubStatus(null);
                }
            } catch (error) {
                Toast.show({ type: "error", text1: t("Failed to load clubs or status") });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [collegeId, currentPage, studentId]);

    const handleJoinClick = async (clubId: string) => {
        if (!studentId) {
            Toast.show({ type: "error", text1: t("Student ID is missing. Cannot send request.") });
            return;
        }
        setJoiningClubId(clubId);
        try {
            await joinClubAPI(parseInt(clubId, 10), parseInt(studentId.toString(), 10));
            Toast.show({ type: "success", text1: t("Join request sent successfully!") });
            setActiveClubId(clubId);
            setActiveClubStatus("pending");
        } catch (error: any) {
            Toast.show({ type: "error", text1: error.message || t("Failed to send request.") });
        } finally {
            setJoiningClubId(null);
        }
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 items-center justify-center pt-20`}>
                <ActivityIndicator size="large" color="#43C17A" />
            </View>
        );
    }

    if (clubs.length === 0) {
        return (
            <View style={tw`flex-1 items-center pt-20`}>
                <Text style={tw`text-gray-500 font-medium text-lg`}>
                    {t("No clubs found at the moment")}
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={clubs}
            keyExtractor={(item) => item.id.toString()}
            numColumns={1} 
            contentContainerStyle={tw`pb-20 px-4`}
            renderItem={({ item: club }) => {
                const isAlreadyInAClub = activeClubStatus === "accepted";
                const isPendingForAClub = activeClubStatus === "pending";
                const isThisClubTheActiveOne = activeClubId === club.id.toString();
                const isCurrentlyJoining = joiningClubId === club.id.toString();

                const isButtonDisabled =
                    joiningClubId !== null ||
                    isPendingForAClub ||
                    (isAlreadyInAClub && !isThisClubTheActiveOne);

                let buttonText = t("Join Club");
                if (isCurrentlyJoining) buttonText = t("Sending Request");
                else if (isThisClubTheActiveOne && isPendingForAClub)
                    buttonText = t("Pending");
                else if (isThisClubTheActiveOne && isAlreadyInAClub)
                    buttonText = t("View Club");

                let buttonClass = "bg-[#16284F]";
                if (isThisClubTheActiveOne && isPendingForAClub) {
                    buttonClass = "bg-[#FB8000]";
                } else if (isThisClubTheActiveOne && isAlreadyInAClub) {
                    buttonClass = "bg-[#43C17A]";
                } else if (isButtonDisabled) {
                    buttonClass = "bg-gray-300";
                }

                return (
                    <View style={tw`bg-[#FB8000]/10 rounded-2xl flex-col items-center px-4 pb-5 pt-[60px] relative mt-16 mb-4`}>
                        <View style={tw`absolute -top-[50px] w-[110px] h-[110px] rounded-full bg-white border-4 border-white items-center justify-center shadow-md overflow-hidden`}>
                            <Avatar src={club.logo} size={110} />
                        </View>

                        <Text style={tw`text-[#282828] font-bold text-lg mb-4 text-center mt-6`}>
                            {club.name}
                        </Text>

                        <View style={tw`flex-row gap-3 w-full mb-6`}>
                            <View style={tw`flex-1 bg-[#43C17A]/20 py-2 rounded-md`}>
                                <Text style={tw`text-[#43C17A] text-[12px] text-center font-bold`}>
                                    {t("Active Users:")} {club.active || 0}
                                </Text>
                            </View>
                            <View style={tw`flex-1 bg-[#FF2A2A]/20 py-2 rounded-md`}>
                                <Text style={tw`text-[#FF2A2A] text-[12px] text-center font-bold`}>
                                    {t("Inactive Users:")} {club.inactive || 0}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                if (isThisClubTheActiveOne && isAlreadyInAClub) {
                                    onNavigateMyClub();
                                } else if (!isButtonDisabled) {
                                    handleJoinClick(club.id.toString());
                                }
                            }}
                            disabled={isButtonDisabled}
                            style={tw`w-full py-3 rounded-xl shadow-md items-center justify-center ${buttonClass}`}
                        >
                            <Text style={tw`text-base font-bold ${isButtonDisabled && !isThisClubTheActiveOne ? 'text-gray-500' : 'text-white'}`}>
                                {buttonText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }}
        />
    );
}
