import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import tw from "twrnc";
import { useUser } from "@/utils/context/UserContext";

import ClubInfo from "./components/ClubInfo";
import TabNavigation from "./components/TabNavigation";
import Announcements from "./components/Announcements";
import RequestsList from "./components/RequestsList";
import AllClubsGrid from "./components/AllClubsGrid";

import { getFacultyClubDetailsAPI } from "@/lib/helpers/clubActivity/facultyClubAPI";
import { getStudentClubDetailsAPI } from "@/lib/helpers/clubActivity/studentClubAPI";
import Toast from "react-native-toast-message";

interface SharedClubProps {
    role: "student" | "faculty";
}

export default function SharedClub({ role }: SharedClubProps) {
    const { userId, collegeId, studentId, facultyId } = useUser();
    
    // For faculty
    const [clubData, setClubData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // For student
    const [clubStatus, setClubStatus] = useState<"loading" | "none" | "pending" | "joined" | "error">("loading");
    const [studentRole, setStudentRole] = useState<string | null>(null);

    // Common
    const [currentTab, setCurrentTab] = useState<string>("");
    const [currentFilter, setCurrentFilter] = useState<string>("all");

    useEffect(() => {
        if (!userId) return;

        const loadFacultyData = async () => {
            if (!facultyId) return;
            try {
                setIsLoading(true);
                const data = await getFacultyClubDetailsAPI(facultyId);
                setClubData(data);
                if (data) {
                    setCurrentTab("info");
                }
            } catch (error) {
                Toast.show({ type: "error", text1: "Failed to fetch club information." });
            } finally {
                setIsLoading(false);
            }
        };

        const loadStudentData = async () => {
            if (!studentId) return;
            try {
                setIsLoading(true);
                const data = await getStudentClubDetailsAPI(studentId);
                setClubStatus(data.status as any);
                setClubData(data.clubInfo);
                setStudentRole(data.role);
                setCurrentTab("myclub");
            } catch (error) {
                Toast.show({ type: "error", text1: "Failed to load club information." });
                setClubStatus("error");
            } finally {
                setIsLoading(false);
            }
        };

        if (role === "faculty") {
            loadFacultyData();
        } else {
            loadStudentData();
        }
    }, [userId, role, studentId, facultyId]);

    if (isLoading || (role === "student" && clubStatus === "loading")) {
        return (
            <View style={tw`flex-1 items-center justify-center bg-[#F4F5F6]`}>
                <ActivityIndicator size="large" color="#43C17A" />
            </View>
        );
    }

    if (role === "faculty") {
        if (!clubData) {
            return (
                <View style={tw`flex-1 items-center justify-center bg-[#F4F5F6] p-4`}>
                    <Text style={tw`text-xl font-bold text-[#16284F] mb-2`}>No Club Assigned</Text>
                    <Text style={tw`text-gray-500 font-medium text-center`}>
                        You are not currently assigned as a Responsible Faculty or Mentor for any active clubs.
                    </Text>
                </View>
            );
        }

        const facultyRole = clubData?.role || "mentor";

        return (
            <View style={tw`flex-1 bg-[#F4F5F6]`}>
                <View style={tw`bg-white mt-2 flex-1 rounded-t-3xl shadow-sm pt-6`}>
                    <View style={tw`items-center mb-6`}>
                        <TabNavigation 
                            currentTab={currentTab} 
                            onTabChange={setCurrentTab}
                            tabs={[
                                { id: "info", label: "Info" },
                                { id: "requests", label: "Requests" },
                                { id: "chat", label: "Chat" }
                            ]}
                        />
                    </View>

                    {currentTab === "info" ? (
                        <ScrollView contentContainerStyle={tw`pb-10`}>
                            <ClubInfo info={clubData} />
                        </ScrollView>
                    ) : currentTab === "requests" ? (
                        <View style={tw`flex-1`}>
                            <RequestsList 
                                clubId={clubData.id} 
                                currentFilter={currentFilter} 
                                onChangeFilter={setCurrentFilter} 
                            />
                        </View>
                    ) : (
                        <View style={tw`flex-1`}>
                            <Announcements 
                                userRole={facultyRole} 
                                clubId={parseInt(clubData.id)} 
                                collegeId={collegeId!} 
                                roleType="faculty" 
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // Role is student
    if (clubStatus === "error") {
        return (
            <View style={tw`flex-1 items-center justify-center bg-[#F4F5F6] p-4`}>
                <Text style={tw`text-xl font-bold text-red-500 mb-2`}>Connection Error</Text>
                <Text style={tw`text-gray-500 font-medium text-center`}>
                    Please refresh to try loading your club again.
                </Text>
            </View>
        );
    }

    const studentTabs = [
        { id: "myclub", label: "My Club" },
        { id: "chat", label: "Chat" },
        { id: "all", label: "Explore" }
    ].filter(t => t.id !== "chat" || clubStatus === "joined");

    return (
        <View style={tw`flex-1 bg-[#F4F5F6]`}>
            <View style={tw`bg-white mt-2 flex-1 rounded-t-3xl shadow-sm pt-6`}>
                <View style={tw`items-center mb-6`}>
                    <TabNavigation 
                        currentTab={currentTab} 
                        onTabChange={setCurrentTab}
                        tabs={studentTabs}
                    />
                </View>

                {currentTab === "all" ? (
                    <AllClubsGrid onNavigateMyClub={() => setCurrentTab("myclub")} />
                ) : currentTab === "chat" && clubStatus === "joined" ? (
                    <View style={tw`flex-1`}>
                        <Announcements 
                            userRole={studentRole || "member"} 
                            clubId={parseInt(clubData?.id || "0")} 
                            collegeId={collegeId!} 
                            roleType="student" 
                        />
                    </View>
                ) : (
                    <View style={tw`flex-1`}>
                        {clubStatus === "none" ? (
                            <View style={tw`flex-1 items-center justify-center p-4`}>
                                <Text style={tw`text-xl font-bold text-[#16284F] mb-2`}>No Club Joined</Text>
                                <Text style={tw`text-gray-500 font-medium text-center`}>
                                    You are not currently a member of any club. Explore the available clubs and send a request to join one!
                                </Text>
                            </View>
                        ) : clubStatus === "pending" ? (
                            <View style={tw`flex-1 items-center justify-center p-4`}>
                                <Text style={tw`text-xl font-bold text-[#16284F] mb-2`}>Request Pending</Text>
                                <Text style={tw`text-gray-500 font-medium text-center`}>
                                    Your request to join {clubData?.name} is currently pending approval by the responsible faculty or mentors.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={tw`pb-10`}>
                                <ClubInfo info={clubData} />
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}
