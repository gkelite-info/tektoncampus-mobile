import React from "react";
import { View, Text, StyleSheet, ImageBackground, Image } from "react-native";
import { useAuthStore } from "@/store/authStore";

export type UserInfoCardProps = {
    show?: boolean;
    todayCollection: number;
    top?: string;
    imageHeight?: number;
    imageAlign?: "center" | "bottom";
};

type UserInfoProps = {
    cardProps: UserInfoCardProps[];
};

export default function UserInfoCard({ cardProps }: UserInfoProps) {
    const user = useAuthStore((state) => state.user);
    // Assuming the API returns gender in the user object or defaulting to Male for asset selection
    const gender = (user as any)?.gender || "Male"; 
    const fullName = user?.fullName || "User";

    const bgBanner = require("../../../../../assets/dashboard-banner-bg.png");
    const avatarImage =
        gender === "Male"
            ? require("../../../../../assets/male-ca.png")
            : require("../../../../../assets/female-ca.png");

    return (
        <View style={styles.container}>
            <ImageBackground
                source={bgBanner}
                style={styles.bgBanner}
                imageStyle={{ borderRadius: 16 }}
                resizeMode="cover"
            >
                {cardProps.map((item, index) => (
                    <View style={styles.contentContainer} key={index}>
                        <View style={styles.textContainer}>
                            <Text style={styles.welcomeText}>
                                Welcome Back,{" "}
                                <Text style={styles.userName}>{fullName}</Text>
                            </Text>

                            <Text style={styles.subText}>
                                Here’s a summary of fee collections & student payments
                            </Text>

                            <Text style={styles.collectionText}>
                                Today’s Collections,{" "}
                                <Text style={styles.amountText}>
                                    {item.todayCollection
                                        ? ` ₹${item.todayCollection.toLocaleString("en-IN")}`
                                        : " ₹0"}
                                </Text>
                                {!item.show && " collected so far."}
                            </Text>
                        </View>

                        <View style={styles.avatarContainer}>
                            <Image
                                source={avatarImage}
                                style={styles.avatar}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                ))}
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 170,
        marginBottom: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        backgroundColor: "#BCE6D0", // fallback
    },
    bgBanner: {
        width: "100%",
        height: "100%",
        borderRadius: 16,
    },
    contentContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    textContainer: {
        flexDirection: "column",
        maxWidth: "65%",
        gap: 8,
        marginTop: 12,
    },
    welcomeText: {
        fontSize: 16,
        color: "#282828",
        lineHeight: 22,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#089144",
    },
    subText: {
        fontSize: 14,
        color: "#454545",
    },
    collectionText: {
        fontSize: 14,
        color: "#454545",
        fontWeight: "500",
    },
    amountText: {
        color: "#089144",
        fontWeight: "bold",
    },
    avatarContainer: {
        position: "absolute",
        right: -10,
        bottom: 0,
        height: "105%",
        width: 160,
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
});
