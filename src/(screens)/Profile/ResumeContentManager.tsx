import React, { useEffect, useRef } from "react";
import { View, Text, LayoutAnimation, Platform, UIManager } from "react-native";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const DummyScreen = ({ name }: { name: string }) => (
    <View className="flex-1 bg-white items-center justify-center rounded-xl p-4 shadow-sm">
        <Text className="text-xl font-bold text-gray-500">Resume {name}</Text>
        <Text className="text-gray-400 mt-2">Coming soon in Phase 3...</Text>
    </View>
);

export default function ResumeContentManager({ resumeStepId }: { resumeStepId: number }) {
    const prevStepRef = useRef(resumeStepId);

    useEffect(() => {
        if (prevStepRef.current !== resumeStepId) {
            LayoutAnimation.configureNext(
                LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
            );
            prevStepRef.current = resumeStepId;
        }
    }, [resumeStepId]);

    const renderContent = () => {
        switch (resumeStepId) {
            case 1: return <ResumePersonalDetails />;
            case 2: return <ResumeEducation />;
            case 3: return <ResumeKeySkills />;
            case 4: return <ResumeLanguages />;
            case 5: return <ResumeInternships />;
            case 6: return <ResumeProjects />;
            case 7: return <ResumeAccomplishments />;
            case 8: return <ResumeCompetitiveExams />;
            case 9: return <ResumeEmployment />;
            case 10: return <ResumeAcademicAchievements />;
            case 11: return <ResumeProfileSummary />;
            case 12: return <ResumeTemplates />;
            default: return <ResumePersonalDetails />;
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {renderContent()}
        </View>
    );
}

