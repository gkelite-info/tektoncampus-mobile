import React from "react";
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

    const renderContent = () => {
        switch (profileStepId) {
            case 1: return <ProfileInfo onNext={() => setProfileStepId(2)} />;
            case 2: return <ProfilePersonalDetails />;
            case 3: return <ProfileEducation />;
            case 4: return <ProfileKeySkills />;
            case 5: return <ProfileLanguages />;
            case 6: return <ProfileSummary />;
            default: return <ProfileInfo onNext={() => setProfileStepId(2)} />;
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {renderContent()}
        </View>
    );
}

