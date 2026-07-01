import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/store/authStore";
import {
    GraduationCap,
    UserGear,
    Buildings,
    UsersThree,
} from "phosphor-react-native";
import {
    DashboardStats,
    fetchCollegeAdminDashboardStats,
} from "@/lib/helpers/collegeAdmin/Collegeadmindashboardapi";
import {
    FeeCollectionTrend,
    fetchFeeCollectionTrend,
} from "@/lib/helpers/collegeAdmin/Feecollectiontrendapi";
import { fetchTodayCollectionAmount } from "@/lib/helpers/collegeAdmin/fetchcollection";

import UserInfoCard from "./components/UserInfoCard";
import StatCard from "./components/StatCard";
import QuickLinkCard from "./components/QuickLinkCard";
import AdminProfileCard from "./components/AdminProfileCard";
import FeeCollectionTrendCard from "./components/FeeCollectionTrendCard";

const statConfig = [
    {
        id: 1,
        key: "educationTypeCount",
        label: "Education Types",
        color: "#EAE4FF",
        icon: GraduationCap,
        iconColor: "#7C3AED",
    },
    {
        id: 2,
        key: "totalAdmins",
        label: "Admins",
        color: "#FFF0D9",
        icon: UserGear,
        iconColor: "#EA580C",
    },
    {
        id: 3,
        key: "totalBranches",
        label: "Branches",
        color: "#E2F9EB",
        icon: Buildings,
        iconColor: "#10B981",
    },
    {
        id: 4,
        key: "totalUsers",
        label: "Total Users",
        color: "#D1E9FF",
        icon: UsersThree,
        iconColor: "#2563EB",
    },
] as const;

const quickLinks = [
    "Admins",
    "Faculty",
    "Students",
    "Parents",
    "Finance",
    "Placement",
];

export default function DashboardScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const collegeId = user?.collegeId;

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [trend, setTrend] = useState<FeeCollectionTrend | null>(null);
    const [todayCollection, setTodayCollection] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!collegeId) return;
        const load = async () => {
            setIsLoading(true);
            try {
                const [dashData, trendData, collectionAmt] = await Promise.all([
                    fetchCollegeAdminDashboardStats(collegeId),
                    fetchFeeCollectionTrend(collegeId),
                    fetchTodayCollectionAmount(collegeId),
                ]);
                setStats(dashData);
                setTrend(trendData);
                setTodayCollection(collectionAmt);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [collegeId]);

    const handleSetView = (view: string) => {
        if (view === "Admins") navigation.navigate("AdminList");
        else if (view === "Faculty") navigation.navigate("FacultyList");
        else if (view === "Students") navigation.navigate("StudentList");
        else if (view === "Parents") navigation.navigate("ParentList");
        else if (view === "Finance") navigation.navigate("FinanceList");
        else if (view === "Placement") {

        }
    };

    const userInfoCardProps = [
        {
            show: false,
            todayCollection: todayCollection,
            top: "lg:top-[-173px]",
            imageHeight: 170,
        },
    ];

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#089144" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <UserInfoCard cardProps={userInfoCardProps} />

            <View style={styles.statsGrid}>
                {statConfig.map((stat) => (
                    <View key={stat.id} style={styles.statCardWrapper}>
                        <StatCard
                            label={stat.label}
                            value={String(stats?.[stat.key as keyof DashboardStats] ?? 0)}
                            backgroundColor={stat.color}
                            icon={stat.icon}
                            iconColor={stat.iconColor}
                        />
                    </View>
                ))}
            </View>

            <View style={styles.quickLinksContainer}>
                <View style={styles.quickLinksGrid}>
                    {quickLinks.map((link) => (
                        <View key={link} style={styles.quickLinkWrapper}>
                            <QuickLinkCard
                                title={link}
                                onClick={() => handleSetView(link)}
                            />
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.adminsSection}>
                <View style={styles.adminsHeader}>
                    <Text style={styles.sectionTitle}>Admins</Text>

                </View>

                <FlatList
                    data={stats?.adminDetails ?? []}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => String(item.adminId)}
                    contentContainerStyle={styles.adminsListContainer}
                    renderItem={({ item }) => (
                        <View style={styles.adminCardWrapper}>
                            <AdminProfileCard data={item} />
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No admins found</Text>}
                />
            </View>

            <View style={styles.trendSection}>
                <FeeCollectionTrendCard trend={trend} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    statCardWrapper: {
        width: "48%",
        marginBottom: 16,
    },
    quickLinksContainer: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        marginBottom: 24,
    },
    quickLinksGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    quickLinkWrapper: {
        width: "31%",
        marginBottom: 12,
    },
    adminsSection: {
        marginBottom: 24,
    },
    adminsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    adminsListContainer: {
        paddingBottom: 8,
    },
    adminCardWrapper: {
        marginRight: 16,
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 14,
    },
    trendSection: {
        marginTop: 8,
    },
});
