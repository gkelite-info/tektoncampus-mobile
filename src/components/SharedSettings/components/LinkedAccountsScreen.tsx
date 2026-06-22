import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Linking, AppState } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { useNavigation } from "@react-navigation/native";
import { CaretLeft, GoogleLogo, FacebookLogo, GithubLogo, LinkedinLogo, WindowsLogo } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { useUser } from "@/utils/context/UserContext";
import { syncAndFetchLinkedAccounts, linkUserIdentity, unlinkUserIdentity } from "@/lib/helpers/settings/linkedAccountsAPI";
import { supabase } from "@/lib/supabaseClient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/fonts";

export interface LinkedAccount {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  description: string;
  color: string;
}

const initialAccountData: LinkedAccount[] = [
{ id: "google", name: "Google", icon: GoogleLogo, connected: false, description: "Not Connected", color: "#EF4444" },
{ id: "facebook", name: "Facebook", icon: FacebookLogo, connected: false, description: "Not Connected", color: "#2563EB" },
{ id: "azure", name: "Microsoft", icon: WindowsLogo, connected: false, description: "Not Connected", color: "#F97316" },
{ id: "github", name: "GitHub", icon: GithubLogo, connected: false, description: "Not Connected", color: "#111827" },
{ id: "linkedin_oidc", name: "LinkedIn", icon: LinkedinLogo, connected: false, description: "Not Connected", color: "#1D4ED8" }];


export default function LinkedAccountsScreen() {const { t } = useTranslation();
  const navigation = useNavigation();
  const { userId } = useUser();
  const [accounts, setAccounts] = useState<LinkedAccount[]>(initialAccountData);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadFromSession = async (user: any) => {
    if (!user) return;

    const activeProviders = user.identities?.map((id: any) => id.provider) || [];
    setAccounts((prev) =>
    prev.map((acc) => ({
      ...acc,
      connected: activeProviders.includes(acc.id),
      description: activeProviders.includes(acc.id) ? t("Connected") : t("Not Connected")
    }))
    );

    if (userId) {
      const { syncedProviders, updatedDbAccounts } = await syncAndFetchLinkedAccounts(userId);

      setAccounts((prev) =>
      prev.map((acc) => {
        const isConnected = syncedProviders.includes(acc.id);
        const dbRecord = updatedDbAccounts.find((d: any) => d.provider === acc.id);
        return {
          ...acc,
          connected: isConnected,
          description: isConnected ? `Connected to ${dbRecord?.email || t("your account")}` : t("Not Connected")
        };
      })
      );
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted && data.user) loadFromSession(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted && session?.user) {
        loadFromSession(session.user);
        setProcessingId(null);
      }
    });

    const appStateSub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setProcessingId(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, [userId]);

  const handleToggleLinkedAccount = async (accountId: string) => {
    const targetAccount = accounts.find((acc) => acc.id === accountId);
    if (!targetAccount) return;

    setProcessingId(accountId);

    if (targetAccount.connected) {
      try {
        await unlinkUserIdentity(accountId, userId!);
        setAccounts((prev) =>
        prev.map((a) => a.id === accountId ? { ...a, connected: false, description: t("Not Connected") } : a)
        );
        Toast.show({ type: "success", text1: `${targetAccount.name} disconnected!` });
      } catch (error: any) {
        Toast.show({ type: "error", text1: error.message || t("Failed to disconnect.") });
      } finally {
        setProcessingId(null);
      }
    } else {
      Toast.show({ type: "info", text1: `Connecting ${targetAccount.name}...` });
      try {
        const redirectUrl = ExpoLinking.createURL("settings/linked-accounts");
        const data = await linkUserIdentity(accountId, redirectUrl);

        if (data?.url) {
          await Linking.openURL(data.url);
        } else {
          setProcessingId(null);
        }
      } catch (error: any) {
        Toast.hide();
        Toast.show({ type: "error", text1: error.message || t("Failed to initialize connection.") });
        setProcessingId(null);
      }
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F4F5F6]">
      <ScrollView className="flex-1 px-4" style={{ paddingTop: Math.max(insets.top, 12) + 120 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1 -ml-1 mr-2 rounded-full hover:bg-gray-200">
            
            <CaretLeft size={24} color="#282828" weight="bold" />
          </TouchableOpacity>
          <View>
            <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.ManageLinkedAcc", "Manage Linked Accounts")}

            </Text>
            <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Connectordiscon", "Connect or disconnect your third party accounts")}

            </Text>
          </View>
        </View>

        {/* Accounts List */}
        <View className="pb-8">
          {accounts.map((account) => {
            const Icon = account.icon;
            const isProcessing = processingId === account.id;

            return (
              <View key={account.id} className="flex-row items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-[#ECEFF1] mb-3">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="p-2 rounded-full mr-3" style={{ backgroundColor: `${account.color}15` }}>
                    <Icon size={24} color={account.color} weight="fill" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>
                      {account.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-[12px] text-gray-500 mt-0.5"
                      style={{ fontFamily: fonts.regular }}>
                      
                      {isProcessing ? t("Updating...") : account.description}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-end min-w-[50px]">
                  {isProcessing ?
                  <ActivityIndicator size="small" color="#43C17A" /> :

                  <Switch
                    value={account.connected}
                    onValueChange={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleToggleLinkedAccount(account.id);
                    }}
                    trackColor={{ false: "#D1D5DB", true: "#43C17A" }}
                    thumbColor="#fff" />

                  }
                </View>
              </View>);

          })}
        </View>
      </ScrollView>
    </View>);

}