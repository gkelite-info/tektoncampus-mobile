import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from "phosphor-react-native";

import ProfileSteps from "./components/ProfileSteps";
import ResumeSteps, { RESUME_STEP_DATA } from "./components/ResumeSteps";
import ProfileDashboard from "./ProfileDashboard";
import ProfileContentManager from "./ProfileContentManager";
import ResumeContentManager from "./ResumeContentManager";

export default function ProfileContainer() {
    const [showDashboard, setShowDashboard] = useState(true);
    const [isProfileMode, setIsProfileMode] = useState(true);
    const [profileStepId, setProfileStepId] = useState(1);
    const [resumeStepId, setResumeStepId] = useState(1);

    const insets = useSafeAreaInsets();
    const headerHeight = insets.top + 60; // Approximate navigation header height

    const handleProfileStepChange = (id: number) => {
        setProfileStepId(id);
    };

    const handleResumeStepChange = (id: number) => {
        setResumeStepId(id);
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

                {/* Dynamic Content via React State */}
                <View className="flex-1">
                    {/* Header Navigators */}
                    <View className="px-4 z-10">
                        {isProfileMode ? (
                            <ProfileSteps
                                currentStepId={profileStepId}
                                onStepChange={(step) => handleProfileStepChange(step.id)}
                            />
                        ) : (
                            <ResumeSteps
                                currentStepId={resumeStepId}
                                onStepChange={(step) => handleResumeStepChange(step.id)}
                            />
                        )}
                    </View>

                    {/* Content Container */}
                    <View className="flex-1 px-4 mt-2">
                        {isProfileMode ? (
                            <ProfileContentManager 
                                profileStepId={profileStepId} 
                                setProfileStepId={handleProfileStepChange} 
                            />
                        ) : (
                            <ResumeContentManager 
                                resumeStepId={resumeStepId} 
                            />
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
}

