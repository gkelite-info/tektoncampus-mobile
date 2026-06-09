import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from "phosphor-react-native";

import ProfileSteps from "./components/ProfileSteps";
import ResumeSteps from "./components/ResumeSteps";
import ProfileDashboard from "./ProfileDashboard";

// Profile Sections
import ProfileInfo from "./sections/ProfileInfo";
import ProfilePersonalDetails from "./sections/ProfilePersonalDetails";
import ProfileEducation from "./sections/ProfileEducation";
import ProfileKeySkills from "./sections/ProfileKeySkills";
import ProfileLanguages from "./sections/ProfileLanguages";
import ProfileSummary from "./sections/ProfileSummary";

// Resume Sections
import ResumePersonalDetails from "./resume/ResumePersonalDetails";
import ResumeEducation from "./resume/ResumeEducation";
import ResumeEmployment from "./resume/ResumeEmployment";
import ResumeInternships from "./resume/ResumeInternships";
import ResumeProjects from "./resume/ResumeProjects";
import ResumeKeySkills from "./resume/ResumeKeySkills";
import ResumeLanguages from "./resume/ResumeLanguages";
import ResumeAccomplishments from "./resume/ResumeAccomplishments";
import ResumeCompetitiveExams from "./resume/ResumeCompetitiveExams";
import ResumeAcademicAchievements from "./resume/ResumeAcademicAchievements";
import ResumeProfileSummary from "./resume/ResumeProfileSummary";
import ResumeTemplates from "./resume/ResumeTemplates";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileContainer() {
    const [showDashboard, setShowDashboard] = useState(true);
    const [isProfileMode, setIsProfileMode] = useState(true);
    
    // Track active steps for the top visual indicators
    const [profileStepId, setProfileStepId] = useState(1);
    const [resumeStepId, setResumeStepId] = useState(1);

    const profileScrollRef = useRef<ScrollView>(null);
    const resumeScrollRef = useRef<ScrollView>(null);

    const insets = useSafeAreaInsets();
    const headerHeight = insets.top + 60; 

    // Handle jumping between Profile tabs
    const handleProfileStepChange = (step: any) => {
        setProfileStepId(step.id);
        profileScrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (step.id - 1), animated: true });
    };

    // Handle jumping between Resume tabs
    const handleResumeStepChange = (step: any) => {
        setResumeStepId(step.id);
        // Note: if ResumeSteps filters out Employment based on fresher status, 
        // the step.id might skip 9, but we always render all 12 blocks sequentially in the ScrollView to prevent unmounts.
        resumeScrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (step.id - 1), animated: true });
    };

    const handleModeSwitch = (toProfile: boolean) => {
        setIsProfileMode(toProfile);
    };

    if (showDashboard) {
        return <ProfileDashboard onOpenProfileDetails={() => setShowDashboard(false)} />;
    }

    return (
        <View className="flex-1 bg-[#F4F4F4]" style={{ paddingTop: headerHeight + 30, paddingBottom: 130 }}>
            <View className="flex-1 pt-4">
                {/* Mode Toggles with Back Button */}
                <View className="flex-row items-center mb-4 px-4">
                    <TouchableOpacity onPress={() => setShowDashboard(true)} className="p-2 mr-2">
                        <ArrowLeft size={24} color="#282828" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleModeSwitch(true)}>
                        <Text className={`text-lg font-bold ${isProfileMode ? "text-[#43C17A]" : "text-gray-400"}`}>
                            Profile
                        </Text>
                    </TouchableOpacity>
                    <Text className="text-gray-400 mx-3 text-lg">/</Text>
                    <TouchableOpacity onPress={() => handleModeSwitch(false)}>
                        <Text className={`text-lg font-bold ${!isProfileMode ? "text-[#43C17A]" : "text-gray-400"}`}>
                            Resume
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Flow */}
                <View style={{ flex: 1, display: isProfileMode ? 'flex' : 'none' }}>
                    <View className="px-4 z-10">
                        <ProfileSteps currentStepId={profileStepId} onStepChange={handleProfileStepChange} />
                    </View>
                    <View className="flex-1 mt-2">
                        <ScrollView 
                            ref={profileScrollRef}
                            horizontal
                            pagingEnabled
                            scrollEnabled={false} // Controlled exclusively via Top Tabs
                            showsHorizontalScrollIndicator={false}
                            bounces={false}
                        >
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ProfileInfo onNext={() => handleProfileStepChange({ id: 2 })} />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ProfilePersonalDetails />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ProfileEducation />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ProfileKeySkills />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ProfileLanguages />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ProfileSummary />
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Resume Flow */}
                <View style={{ flex: 1, display: !isProfileMode ? 'flex' : 'none' }}>
                    <View className="px-4 z-10">
                        <ResumeSteps currentStepId={resumeStepId} onStepChange={handleResumeStepChange} />
                    </View>
                    <View className="flex-1 mt-2">
                        <ScrollView 
                            ref={resumeScrollRef}
                            horizontal
                            pagingEnabled
                            scrollEnabled={false} // Controlled exclusively via Top Tabs
                            showsHorizontalScrollIndicator={false}
                            bounces={false}
                        >
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumePersonalDetails />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeEducation />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeKeySkills />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeLanguages />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeInternships />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeProjects />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeAccomplishments />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeCompetitiveExams />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeEmployment />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeAcademicAchievements />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeProfileSummary />
                            </View>
                            <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
                                <ResumeTemplates />
                            </View>
                        </ScrollView>
                    </View>
                </View>

            </View>
        </View>
    );
}



