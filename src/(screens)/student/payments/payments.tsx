import React from "react";
import SharedPaymentDashboard from "@/components/payments/SharedPaymentDashboard";
import { useUser } from "@/utils/context/UserContext";
import PaymentsSkeleton from "@/components/payments/PaymentsSkeleton";
import { Text, View } from "react-native";

export default function StudentPayments() {
    const { userId, profilePhoto, loading } = useUser();

    if (loading || !userId) {
        return <PaymentsSkeleton />;
    }

    return (
        <SharedPaymentDashboard
            targetUserId={userId}
            profilePhoto={profilePhoto}
            isStudent={true}
        />
    
    );
}