
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus } from 'lucide-react-native';
import { EnvelopeSimple } from 'phosphor-react-native';
import EmailDetailModal, { EmailDetailItem } from './EmailDetailModal';
import ComposeEmailModal from './ComposeEmailModal';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserEmailsChunk, groupAndFormatEmails, markEmailRead } from '@/lib/helpers/notifications/emailsAPI';

type Props = {
    visible: boolean;
    onClose: () => void;
    initialView?: { tab?: "all" | "inbox" | "sent"; compose?: boolean };
};

const EmailShimmer = () => (
    <View className="flex-row gap-3 p-3 mb-2 rounded-lg bg-white border border-gray-100">
        <View className="w-9 h-9 rounded-full bg-gray-200" />
        <View className="flex-1 py-0.5">
            <View className="flex-row justify-between items-center mb-1.5">
                <View className="h-3 bg-gray-200 rounded w-1/3" />
                <View className="h-2 bg-gray-200 rounded w-8" />
            </View>
            <View className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
            <View className="h-2 bg-gray-200 rounded w-5/6" />
        </View>
    </View>
);

export default function EmailModal({ visible, onClose, initialView }: Props) {
    const user = useAuthStore(state => state.user);
    const userId = user?.userId;
    const collegeId = user?.collegeId || 0;

    const [activeTab, setActiveTab] = useState<"all" | "inbox" | "sent">("all");
    const [rawEmails, setRawEmails] = useState<any[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [sessionEmail, setSessionEmail] = useState<string>("__no_email__");

    const [replyData, setReplyData] = useState<any>(null);

    useEffect(() => {
        if (visible && initialView) {
            if (initialView.tab) setActiveTab(initialView.tab);
            if (initialView.compose) setIsComposeOpen(true);
            else setIsComposeOpen(false);
        }
    }, [visible, initialView]);

    const loadInitialEmails = useCallback(async () => {
        if (!userId) {
            setIsLoadingInitial(false);
            return;
        }
        setIsLoadingInitial(true);
        setPage(0);
        setHasMore(true);

        const { data: { session } } = await supabase.auth.getSession();
        const activeEmail = session?.user?.email || "__no_email__";
        setSessionEmail(activeEmail);

        let currentRaw: any[] = [];
        let nextPage = 0;
        let newlyHasMore = true;
        let groupedLen = 0;

                    while (newlyHasMore && groupedLen < 12) {
            const data = await fetchUserEmailsChunk(
                userId,
                activeEmail,
                activeTab,
                nextPage,
                12,
            );
            currentRaw = [...currentRaw, ...data];
            newlyHasMore = data.length === 12;
            nextPage++;
            groupedLen = groupAndFormatEmails(currentRaw, activeEmail).length;
        }

        setRawEmails(currentRaw);
        setPage(nextPage - 1);
        setHasMore(newlyHasMore);
        setIsLoadingInitial(false);
    }, [userId, activeTab]);

    const loadMoreEmails = async () => {
        if (!userId || isLoadingMore || !hasMore || isLoadingInitial) return;
        setIsLoadingMore(true);

        let currentRaw = [...rawEmails];
        let currentGroupedLen = groupAndFormatEmails(currentRaw, sessionEmail).length;
        let nextPage = page + 1;
        let newlyHasMore = true;

        while (newlyHasMore) {
            const data = await fetchUserEmailsChunk(
                userId,
                sessionEmail,
                activeTab,
                nextPage,
                12,
            );
            currentRaw = [...currentRaw, ...data];
            newlyHasMore = data.length === 12;
            nextPage++;

            const newGroupedLen = groupAndFormatEmails(currentRaw, sessionEmail).length;
            if (newGroupedLen >= currentGroupedLen + 3 || !newlyHasMore) {
                break;
            }
        }

        setRawEmails(currentRaw);
        setPage(nextPage - 1);
        setHasMore(newlyHasMore);
        setIsLoadingMore(false);
    };

    useEffect(() => {
        if (visible) loadInitialEmails();
    }, [visible, activeTab, loadInitialEmails]);

    const handleEmailClick = async (mail: any) => {
        setSelectedEmail(mail);
        if (!mail.isRead) {
            setRawEmails((prev) =>
                prev.map((e) =>
                    e.emailQueueId === mail.id ? { ...e, isRead: true } : e,
                ),
            );
            await markEmailRead(mail.id);
        }
    };

    const handleReplyClick = (mail: any) => {
        setReplyData({
            to: mail.email,
            subject: mail.subject,
            body: mail.body,
            senderName: mail.sender,
            date: mail.date,
            time: mail.time,
        });
        setSelectedEmail(null);
        setTimeout(() => setIsComposeOpen(true), 300); 
    };

    const displayedEmails = useMemo(() => {
        return groupAndFormatEmails(rawEmails, sessionEmail);
    }, [rawEmails, sessionEmail]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => handleEmailClick(item)}
            className={`flex-row gap-3 p-3 mb-1.5 rounded-lg border ${
                item.isRead ? 'bg-white border-transparent' : 'bg-blue-50 border-blue-100'
            }`}
        >
            <View
                className="items-center justify-center rounded-full w-9 h-9"
                style={{ backgroundColor: item.color }}
            >
                <Text className="text-[14px] font-medium text-[#080808]">
                    {item.initials}
                </Text>
            </View>

            <View className="flex-1">
                <View className="flex-row justify-between items-center">
                    <Text
                        className={`text-[13px] flex-1 mr-2 ${item.isRead ? 'text-[#414141] font-normal' : 'text-blue-900 font-semibold'}`}
                        numberOfLines={1}
                    >
                        {item.sender}
                    </Text>
                    <Text className="text-[10px] text-[#6B7280]">
                        {item.displayDate}
                    </Text>
                </View>
                <Text
                    className={`mt-0.5 text-[14px] ${item.isRead ? 'font-medium text-[#111827]' : 'font-bold text-gray-900'}`}
                    numberOfLines={1}
                >
                    {item.subject}
                </Text>
                <Text
                    className={`mt-0.5 text-[12px] ${item.isRead ? 'font-normal text-[#414141]' : 'text-gray-700'}`}
                    numberOfLines={1}
                >
                    {item.desc}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"}
            transparent={Platform.OS === 'android'}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent', paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F4F4', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    <View className="flex-row items-center gap-2">
                        <EnvelopeSimple size={24} weight="fill" color="#43C17A" />
                        <Text className="text-[17px] font-bold text-[#282828]">Email</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            onPress={() => {
                                setReplyData(null);
                                setIsComposeOpen(true);
                            }}
                            className="flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full"
                        >
                            <Plus size={16} color="#43C17A" />
                            <Text className="text-[13px] font-medium text-[#282828]">Compose</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-transparent">
                            <X size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row items-center gap-6 px-5 pt-3 bg-white border-b border-gray-100">
                    {["all", "inbox", "sent"].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab as any)}
                            className={`pb-2 border-b-2 ${
                                activeTab === tab ? 'border-[#43C17A]' : 'border-transparent'
                            }`}
                        >
                            <Text
                                className={`text-[14px] font-semibold capitalize ${
                                    activeTab === tab ? 'text-[#43C17A]' : 'text-gray-500'
                                }`}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="flex-1 px-3 pt-3">
                    {isLoadingInitial ? (
                        <View>
                            {[...Array(6)].map((_, i) => <EmailShimmer key={i} />)}
                        </View>
                    ) : displayedEmails.length === 0 ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-[14px] text-gray-500">
                                No {activeTab} emails found.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayedEmails}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            onEndReached={loadMoreEmails}
                            onEndReachedThreshold={0.5}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                isLoadingMore ? (
                                    <View className="py-2 mb-4">
                                        <ActivityIndicator size="small" color="#43C17A" />
                                    </View>
                                ) : <View className="h-4" />
                            }
                        />
                    )}
                </View>
            </SafeAreaView>
            </View>
            <EmailDetailModal
                visible={!!selectedEmail}
                mail={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onReply={handleReplyClick}
            />
            <ComposeEmailModal
                visible={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                collegeId={collegeId}
                replyData={replyData}
                onSuccess={loadInitialEmails}
            />
        </Modal>
    );
}
