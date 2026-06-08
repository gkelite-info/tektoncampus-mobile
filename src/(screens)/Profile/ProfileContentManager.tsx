import React, { useState, useEffect } from "react";
import { View } from "react-native";
import ProfileInfo from "./sections/ProfileInfo";
import ProfilePersonalDetails from "./sections/ProfilePersonalDetails";
import ProfileEducation from "./sections/ProfileEducation";
import ProfileKeySkills from "./sections/ProfileKeySkills";
import ProfileLanguages from "./sections/ProfileLanguages";
import ProfileSummary from "./sections/ProfileSummary";

type ProfileContentManagerProps = {
    profileStepId: number;
    setProfileStepId: (id: number) => void;
};

export default function ProfileContentManager({ profileStepId, setProfileStepId }: ProfileContentManagerProps) {
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

    useEffect(() => {
        setVisitedSteps(prev => {
            if (prev.has(profileStepId)) return prev;
            const next = new Set(prev);
            next.add(profileStepId);
            return next;
        });
    }, [profileStepId]);

    const renderStep = (id: number, Component: React.FC<any>, props?: any) => {
        if (!visitedSteps.has(id)) return null;
        return (
            <View key={id} style={{ flex: 1, display: profileStepId === id ? "flex" : "none" }}>
                <Component {...props} />
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {renderStep(1, ProfileInfo, { onNext: () => setProfileStepId(2) })}
            {renderStep(2, ProfilePersonalDetails)}
            {renderStep(3, ProfileEducation)}
            {renderStep(4, ProfileKeySkills)}
            {renderStep(5, ProfileLanguages)}
            {renderStep(6, ProfileSummary)}
        </View>
    );
}

