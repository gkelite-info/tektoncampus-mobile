import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";

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
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

    useEffect(() => {
        setVisitedSteps(prev => {
            if (prev.has(resumeStepId)) return prev;
            const next = new Set(prev);
            next.add(resumeStepId);
            return next;
        });
    }, [resumeStepId]);

    const renderStep = (id: number, Component: React.FC<any>, props?: any) => {
        if (!visitedSteps.has(id)) return null;
        return (
            <View key={id} style={{ flex: 1, display: resumeStepId === id ? "flex" : "none" }}>
                <Component {...props} />
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {renderStep(1, ResumePersonalDetails)}
            {renderStep(2, ResumeEducation)}
            {renderStep(3, ResumeKeySkills)}
            {renderStep(4, ResumeLanguages)}
            {renderStep(5, ResumeInternships)}
            {renderStep(6, ResumeProjects)}
            {renderStep(7, ResumeAccomplishments)}
            {renderStep(8, ResumeCompetitiveExams)}
            {renderStep(9, ResumeEmployment)}
            {renderStep(10, ResumeAcademicAchievements)}
            {renderStep(11, ResumeProfileSummary)}
            {renderStep(12, ResumeTemplates)}
        </View>
    );
}

