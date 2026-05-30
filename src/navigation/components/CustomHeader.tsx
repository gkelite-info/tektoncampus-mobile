import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Newspaper, EnvelopeSimple, BellSimple, Megaphone, MagnifyingGlass } from 'phosphor-react-native';
import AnimatedHamburger from './AnimatedHamburger';
import NewsModal from '@/components/modals/NewsModal';
import EmailModal from '@/components/modals/EmailModal';
import NotificationsModal from '@/components/modals/NotificationsModal';
import AnnouncementModal from '@/components/modals/AnnouncementModal';
import { useUser } from '@/utils/context/UserContext';

export default function CustomHeader() {
    const { role, identifierId } = useUser();
    const displayRole = role || 'Guest';

    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadEmailCount, setUnreadEmailCount] = useState(0);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const [isNewsOpen, setIsNewsOpen] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [emailInitialView, setEmailInitialView] = useState<{
        tab?: "all" | "inbox" | "sent";
        compose?: boolean;
    }>({});

    const insets = useSafeAreaInsets();

    return (
        <>
            <BlurView
                intensity={80}
                tint="light"
                experimentalBlurMethod="dimezisBlurView"
                style={{ paddingTop: insets.top, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                className="border-b-0 border-transparent"
            >
                <View className={`px-4 pt-2 pb-3 ${Platform.OS === 'android' ? 'mt-2' : ''}`}>
                    <View className="flex-row items-center justify-between mb-3 z-10">
                        <View className="-ml-3">
                            <AnimatedHamburger />
                        </View>

                        <View className="flex-row items-center gap-3 md:gap-4">
                            <TouchableOpacity onPress={() => setIsNewsOpen(true)}>
                                <Newspaper size={21} color="#282828" />
                            </TouchableOpacity>

                            <TouchableOpacity className="relative" onPress={() => {
                                setEmailInitialView({ compose: false, tab: "all" });
                                setIsEmailOpen(true);
                            }}>
                                <EnvelopeSimple size={21} color="#282828" />
                                {unreadEmailCount > 0 && (
                                    <View className="absolute -top-1.5 -right-1.5 bg-red-500 w-[14px] h-[14px] rounded-full items-center justify-center border border-white">
                                        <Text className="text-white text-[8px] font-bold">
                                            {unreadEmailCount > 99 ? '99+' : unreadEmailCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity className="relative" onPress={() => setIsNotificationsOpen(true)}>
                                <BellSimple size={21} color="#282828" />
                                {unreadCount > 0 && (
                                    <View className="absolute -top-1.5 -right-1.5 bg-red-500 w-[14px] h-[14px] rounded-full items-center justify-center border border-white">
                                        <Text className="text-white text-[8px] font-bold">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setIsAnnouncementOpen(true)}>
                                <Megaphone size={21} color="#282828" />
                            </TouchableOpacity>

                            {/* <TouchableOpacity className="flex-row items-center ml-1 bg-gray-200 rounded-full px-2.5 py-1.5">
                                <Text className="text-[11px] text-gray-700 font-medium">ID - {identifierId || 'N/A'}</Text>
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center bg-[#EAEAEA] rounded-full h-[38px] px-4 mr-2 border border-transparent focus:border-[#43C17A]/40">
                            <TextInput
                                className="flex-1 text-[#282828] text-sm py-0"
                                placeholder="What do you want to find?"
                                placeholderTextColor="#9CA3AF"
                                value={searchValue}
                                onChangeText={setSearchValue}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                            />
                            <MagnifyingGlass size={18} color="#43C17A" weight="bold" />
                        </View>

                        {(displayRole.includes('Faculty') || displayRole.includes('Student')) && (
                            <TouchableOpacity className="bg-[#43C17A] h-[38px] px-3 md:px-4 rounded-md items-center justify-center">
                                <Text className="text-white text-xs md:text-sm font-medium">Add task +</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </BlurView>

            <NewsModal visible={isNewsOpen} onClose={() => setIsNewsOpen(false)} />
            <EmailModal visible={isEmailOpen} onClose={() => setIsEmailOpen(false)} initialView={emailInitialView} />
            <NotificationsModal visible={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
            <AnnouncementModal visible={isAnnouncementOpen} onClose={() => setIsAnnouncementOpen(false)} />
        </>
    );
}
