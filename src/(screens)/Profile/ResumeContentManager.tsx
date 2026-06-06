import React from "react";
import { View, Text } from "react-native";
import { MotiView, AnimatePresence } from "moti";

const DummyScreen = ({ name }: { name: string }) => (
    <View className="flex-1 bg-white items-center justify-center rounded-xl p-4 shadow-sm">
        <Text className="text-xl font-bold text-gray-500">Resume {name}</Text>
        <Text className="text-gray-400 mt-2">Coming soon in Phase 3...</Text>
    </View>
);

export default function ResumeContentManager({ resumeStepId }: { resumeStepId: number }) {
    const renderContent = () => {
        switch (resumeStepId) {
            case 1: return <DummyScreen name="Personal Details" />;
            case 2: return <DummyScreen name="Education" />;
            case 3: return <DummyScreen name="Key Skills" />;
            case 4: return <DummyScreen name="Languages" />;
            case 5: return <DummyScreen name="Internships" />;
            case 6: return <DummyScreen name="Projects" />;
            case 7: return <DummyScreen name="Accomplishments" />;
            case 8: return <DummyScreen name="Competitive Exams" />;
            case 9: return <DummyScreen name="Employment" />;
            case 10: return <DummyScreen name="Academic Achievements" />;
            case 11: return <DummyScreen name="Profile Summary" />;
            default: return <DummyScreen name="Personal Details" />;
        }
    };

    return (
        <AnimatePresence exitBeforeEnter>
            <MotiView
                key={`resume-step-${resumeStepId}`}
                from={{ opacity: 0, translateX: 10 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -10 }}
                transition={{ type: "timing", duration: 250 }}
                className="flex-1"
            >
                {renderContent()}
            </MotiView>
        </AnimatePresence>
    );
}
