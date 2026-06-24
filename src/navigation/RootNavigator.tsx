import React, { useEffect, useMemo, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { InitialState, NavigationContainer } from "@react-navigation/native";
import LoginScreen from "@/(screens)/(auth)/loginScreen";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import { StudentProvider } from "@/utils/context/student/useStudent";
import StudentDrawerNavigator from "./StudentDrawerNavigator";
import FacultyDrawerNavigator from "./FacultyDrawerNavigator";
import ParentDrawerNavigator from "./ParentDrawerNavigator";
import { FacultyProvider } from "@/utils/context/faculty/useFaculty";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";

const AuthStack = createNativeStackNavigator();

type AppUser = {
    userId: number;
    fullName: string;
    role: string;
    collegeId: number;
};

const NAVIGATION_STATE_PREFIX = "tektoncampus:navigation-state:v3-stack-sidebar";

function isNavigationStateValidForRole(
    state: InitialState | undefined,
    role: string
) {
    if (!state?.routes?.length) return false;

    const routeNames = state.routes.map((route) => route.name);

    if (role.includes("faculty")) return routeNames.includes("Dashboard");
    if (role.includes("student")) return routeNames.includes("StudentTabs");
    if (role.includes("parent")) return routeNames.includes("ParentTabs");

    return false;
}

async function getUserProfile(authId: string): Promise<AppUser | null> {
    const { data, error } = await supabase
        .from("users")
        .select("userId, fullName, role, collegeId")
        .eq("auth_id", authId)
        .maybeSingle();

    if (error || !data) return null;

    return data;
}

export default function RootNavigator() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [authReady, setAuthReady] = useState(false);
    const [navigationReady, setNavigationReady] = useState(false);
    const [initialState, setInitialState] = useState<InitialState | undefined>();

    const roleNormalized = (user?.role ?? "").toString().toLowerCase();
    const navigationStateKey = useMemo(() => {
        if (!user) return null;

        return `${NAVIGATION_STATE_PREFIX}:${user.userId}:${roleNormalized}`;
    }, [roleNormalized, user]);

    useEffect(() => {
        let mounted = true;

        const loadUserFromSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!mounted) return;

            if (!session?.user) {
                setUser(null);
                setAuthReady(true);
                return;
            }

            const profile = await getUserProfile(session.user.id);
            if (!mounted) return;

            setUser(profile);
            setAuthReady(true);
        };

        loadUserFromSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT") {
                setUser(null);
                return;
            }

            if (event === "SIGNED_IN" && session?.user) {
                const profile = await getUserProfile(session.user.id);
                setUser(profile);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [setUser]);

    useEffect(() => {
        let mounted = true;

        const restoreNavigationState = async () => {
            setNavigationReady(false);

            if (!navigationStateKey) {
                if (mounted) {
                    setInitialState(undefined);
                    setNavigationReady(true);
                }
                return;
            }

            const savedState = await AsyncStorage.getItem(navigationStateKey);

            if (!mounted) return;

            try {
                const parsedState = savedState
                    ? (JSON.parse(savedState) as InitialState)
                    : undefined;

                setInitialState(
                    isNavigationStateValidForRole(parsedState, roleNormalized)
                        ? parsedState
                        : undefined
                );
            } catch {
                setInitialState(undefined);
            }
            setNavigationReady(true);
        };

        if (authReady) {
            restoreNavigationState();
        }

        return () => {
            mounted = false;
        };
    }, [authReady, navigationStateKey]);

    return (
        <NavigationContainer
            key={navigationStateKey ?? "guest"}
            initialState={undefined}
            onStateChange={(state) => {
                if (!navigationStateKey) return;

                AsyncStorage.setItem(
                    navigationStateKey,
                    JSON.stringify(state)
                );
            }}
        >
            {!authReady || !navigationReady ? (
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="Loading" component={() => (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                            <ActivityIndicator size="large" color="#43C17A" />
                        </View>
                    )} />
                </AuthStack.Navigator>
            ) : !user ? (
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="Login" component={LoginScreen} />
                </AuthStack.Navigator>
            ) : roleNormalized.includes("faculty") ? (
                <FacultyProvider>
                    <FacultyDrawerNavigator />
                </FacultyProvider>
            ) : roleNormalized.includes("student") ? (
                <StudentProvider>
                    <StudentDrawerNavigator />
                </StudentProvider>
            ) : roleNormalized.includes("parent") ? (
                <ParentDrawerNavigator />
            ) : (
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="Login" component={LoginScreen} />
                </AuthStack.Navigator>
            )}
        </NavigationContainer>
    );
}
