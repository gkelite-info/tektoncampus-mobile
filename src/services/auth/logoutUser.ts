import { supabase } from "@/lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const NAVIGATION_STATE_PREFIX = "tektoncampus:navigation-state";

async function clearPersistedNavigationState() {
    const keys = await AsyncStorage.getAllKeys();
    const navigationStateKeys = keys.filter((key) =>
        key.startsWith(NAVIGATION_STATE_PREFIX)
    );

    if (navigationStateKeys.length) {
        await AsyncStorage.multiRemove(navigationStateKeys);
    }
}

export async function logoutUser() {
    try {
        // Only run web storage cleanup if we are explicitly running on a Web platform browser
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        }

        // Global Supabase Sign Out (safely clears native storage automatically)
        const { error } = await supabase.auth.signOut({ scope: 'global' });

        if (error) {
            console.error("Supabase signOut error:", error);
            return { success: false };
        }

        await clearPersistedNavigationState();

        return { success: true };
    } catch (err: any) {
        console.error("Logout error caught:", err);
        // Fallback to true if Supabase already cleared the token but crashed on a web check
        return { success: true };
    }
}
