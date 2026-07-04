import { Text } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BellSimple, X } from 'phosphor-react-native';
import { useUser } from '@/utils/context/UserContext';
import { getUserNotifications, markNotificationRead } from '@/lib/helpers/notifications/notificationAPI';
import { useTranslation } from 'react-i18next';
import Shimmer from '@/components/ui/Shimmer';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function NotificationsModal({ visible, onClose }: Props) {
    const { t } = useTranslation();
    const { userId } = useUser();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function loadNotifications() {
            if (!visible || !userId) return;
            setIsLoading(true);
            try {
                const data = await getUserNotifications(userId);
                setNotifications(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        loadNotifications();
    }, [visible, userId]);

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            setNotifications((prev) =>
                prev.map((n) =>
                    n.notificationId === notif.notificationId
                        ? { ...n, isRead: true }
                        : n
                )
            );
            await markNotificationRead(notif.notificationId);
        }
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"}
            transparent={Platform.OS === 'android'}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent', paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }} edges={['top']}>
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
                    <View className="flex-row items-center gap-2">
                        <BellSimple size={24} weight="fill" color="#43C17A" />
                        <Text className="font-semibold text-lg text-[#282828]">{t("Notifications.Notifications", "Notifications")}</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={onClose}
                        className="p-1.5 rounded-full bg-gray-50"
                    >
                        <X size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView className="flex-1 bg-gray-50/50 p-4">
                    {isLoading ? (
                        <View>
                            {[1, 2, 3, 4, 5].map(i => (
                                <View key={i} className="p-4 mb-3 rounded-xl border bg-white border-gray-100 shadow-sm">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <Shimmer width="70%" height={16} />
                                        <Shimmer width={40} height={12} />
                                    </View>
                                    <Shimmer width="100%" height={14} className="mb-1" />
                                    <Shimmer width="80%" height={14} />
                                </View>
                            ))}
                        </View>
                    ) : notifications.length === 0 ? (
                        <View className="p-8 items-center justify-center">
                            <Text className="text-sm text-gray-500">{t("Notifications.No notifications", "No notifications")}</Text>
                        </View>
                    ) : (
                        notifications.map((notif) => (
                            <TouchableOpacity
                                key={notif.notificationId}
                                onPress={() => handleNotificationClick(notif)}
                                activeOpacity={0.7}
                                className={`p-4 mb-3 rounded-xl border ${
                                    notif.isRead 
                                        ? "bg-white border-gray-100 shadow-sm" 
                                        : "bg-[#43C17A]/10 border-[#43C17A]/20 shadow-sm"
                                }`}
                            >
                                <View className="flex-row justify-between items-start mb-1.5">
                                    <Text 
                                        className={`text-sm flex-1 mr-2 ${
                                            notif.isRead ? "text-gray-800 font-medium" : "text-[#1F5E3B] font-semibold"
                                        }`}
                                    >
                                        {t(notif.title, notif.title)}
                                    </Text>
                                    <Text className="text-[10px] text-gray-500 mt-0.5">
                                        {new Date(notif.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                </View>
                                <Text 
                                    className={`text-xs leading-relaxed ${
                                        notif.isRead ? "text-gray-500" : "text-gray-700"
                                    }`}
                                >
                                    {t(notif.message, notif.message)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
}
