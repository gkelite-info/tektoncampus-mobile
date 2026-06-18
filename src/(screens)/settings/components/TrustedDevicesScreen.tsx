import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { CaretLeft, Phone, Monitor } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/fonts";

export interface TrustedDevice {
  id: string;
  name: string;
  icon: any;
  lastActivity: string;
  location: string;
  status: "Trusted" | "Untrusted" | "Current Session";
  browser: string;
}

const mockDeviceData: TrustedDevice[] = [
{ id: "samsung-a52", name: "Samsung Galaxy A52", icon: Phone, lastActivity: "Yesterday at 5:30 PM", location: "Telangana , Hyderabad", status: "Trusted", browser: "Chrome" },
{ id: "lenovo-laptop", name: "Lenovo Laptop", icon: Monitor, lastActivity: "Yesterday at 2:00 AM", location: "Telangana , Hyderabad", status: "Trusted", browser: "Safari" },
{ id: "oneplus-9", name: "OnePlus 9", icon: Phone, lastActivity: "Yesterday at 8:30 PM", location: "Telangana , Hyderabad", status: "Trusted", browser: "Safari" },
{ id: "iphone-15", name: "iPhone 15", icon: Phone, lastActivity: "Yesterday at 11:24 AM", location: "Telangana , Hyderabad", status: "Trusted", browser: "Chrome" }];


export default function TrustedDevicesScreen() {const { t } = useTranslation();
  const navigation = useNavigation();
  const [devices, setDevices] = useState<TrustedDevice[]>(mockDeviceData);

  const handleRemoveDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
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
            <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.TrustedDevicesL", "Trusted Devices List")}

            </Text>
            <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Viewandmanagede", "View and manage devices that have access to your account.")}

            </Text>
          </View>
        </View>

        {/* List wrapped with WIP Overlay equivalent */}
        <View className="relative bg-white p-4 rounded-2xl border border-[#ECEFF1] shadow-sm mb-6 overflow-hidden min-h-[300px]">
          
          <View className="z-0">
            {devices.map((device) => {
              const Icon = device.icon;
              return (
                <View key={device.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center pr-2 flex-1">
                      <View className="p-2.5 rounded-full bg-green-50 mr-3">
                        <Icon size={20} color="#22C55E" weight="bold" />
                      </View>
                      <Text className="text-[16px] text-[#282828] flex-1" style={{ fontFamily: fonts.semiBold }} numberOfLines={1}>
                        {device.name}
                      </Text>
                    </View>
                    <View className="bg-yellow-50 px-2 py-1 rounded-full">
                      <Text className="text-[10px] text-yellow-600" style={{ fontFamily: fonts.bold }}>
                        {device.browser}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4 space-y-1">
                    <Text className="text-[13px]" style={{ fontFamily: fonts.regular }}>
                      <Text className="text-gray-500" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.LastActivity", "Last Activity :")}</Text>
                      <Text className="text-gray-600">{device.lastActivity}</Text>
                    </Text>
                    <Text className="text-[13px]" style={{ fontFamily: fonts.regular }}>
                      <Text className="text-gray-500" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.LocationApprox", "Location ( Approx) :")}</Text>
                      <Text className="text-gray-600">{device.location}</Text>
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-[13px] text-gray-500" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Status", "Status :")}</Text>
                      <View className="bg-green-100 px-2 py-0.5 rounded ml-1">
                        <Text className="text-[11px] text-green-700" style={{ fontFamily: fonts.semiBold }}>
                          {device.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveDevice(device.id)}
                    className="w-full bg-[#16284F] py-3 rounded-lg items-center mt-2">
                    
                    <Text className="text-white text-[13px]" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.RemoveDevice", "Remove Device")}

                    </Text>
                  </TouchableOpacity>
                </View>);

            })}
          </View>

          {/* WIP Overlay overlay */}
          <View className="absolute inset-0 z-10 bg-white/70 items-center justify-center">
            <View className="bg-white/90 px-4 py-3 rounded-xl shadow-sm border border-gray-100 items-center">
              <Text className="text-[14px] text-[#16284F] mb-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.IntegrationinPr", "Integration in Progress")}

              </Text>
              <Text className="text-[11px] text-gray-500 text-center" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.PreviewLayout", "Preview Layout")}

              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>);

}