import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/(screens)/settings/Settings";
import VerifyPasswordScreen from "@/(screens)/settings/components/VerifyPasswordScreen";
import ResetPasswordScreen from "@/(screens)/settings/components/ResetPasswordScreen";
import PasswordDoneScreen from "@/(screens)/settings/components/PasswordDoneScreen";
import LinkedAccountsScreen from "@/(screens)/settings/components/LinkedAccountsScreen";
import TwoStepVerificationScreen from "@/(screens)/settings/components/TwoStepVerificationScreen";
import TrustedDevicesScreen from "@/(screens)/settings/components/TrustedDevicesScreen";
import PrivacyPolicyScreen from "@/(screens)/settings/components/PrivacyPolicyScreen";

export type SettingsStackParamList = {
    SettingsMain: undefined;
    VerifyPassword: undefined;
    ResetPassword: undefined;
    PasswordDone: undefined;
    LinkedAccounts: undefined;
    TwoStepVerification: undefined;
    TrustedDevices: undefined;
    PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SettingsMain">
            <Stack.Screen name="SettingsMain" component={SettingsScreen} />
            <Stack.Screen name="VerifyPassword" component={VerifyPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="PasswordDone" component={PasswordDoneScreen} />
            <Stack.Screen name="LinkedAccounts" component={LinkedAccountsScreen} />
            <Stack.Screen name="TwoStepVerification" component={TwoStepVerificationScreen} />
            <Stack.Screen name="TrustedDevices" component={TrustedDevicesScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
    );
}
