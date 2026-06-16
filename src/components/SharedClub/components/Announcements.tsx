import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import Toast from "react-native-toast-message";
import { PaperPlaneRight, DotsThreeVertical, PencilSimple, Trash } from "phosphor-react-native";
import { supabase } from "@/lib/supabaseClient";
import { Avatar } from "@/components/Avatar";
import {
    fetchAnnouncements,
    postAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    subscribeToClubAnnouncements,
    fetchSingleAnnouncement
} from "@/lib/helpers/clubActivity/announcementAPI";
import { useUser } from "@/utils/context/UserContext";

const FETCH_LIMIT = 20;

export const formatChatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return `Today ${timeString}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${timeString}`;
    return `${date.toLocaleDateString("en-GB")} ${timeString}`;
};

interface AnnouncementsProps {
    userRole: string;
    clubId: number;
    collegeId: number;
    roleType: "student" | "faculty";
}

export default function Announcements({ userRole, clubId, collegeId, roleType }: AnnouncementsProps) {
    const { studentId, facultyId } = useUser();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [isPosting, setIsPosting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const insets = useSafeAreaInsets();

    const channelRef = useRef<any>(null);
    const processedIds = useRef<Set<number>>(new Set());

    const appendMessage = (msg: any) => {
        setMessages(prev => {
            if (prev.some(m => m.announcementId === msg.announcementId)) return prev;
            return [...prev, msg];
        });
    };

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
            setKeyboardVisible(true);
            setKeyboardHeight(e.endCoordinates.height);
        });
        const keyboardDidHideListener = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
        });

        if (!clubId) return;
        const abortController = new AbortController();

        const loadInitial = async () => {
            try {
                setLoading(true);
                const data = await fetchAnnouncements(clubId, undefined, FETCH_LIMIT);
                if (!abortController.signal.aborted) {
                    setMessages(data.reverse());
                    setHasMore(data.length === FETCH_LIMIT);
                }
            } catch (err) {
                if (!abortController.signal.aborted) {
                    Toast.show({ type: "error", text1: "Failed to load announcements" });
                }
            } finally {
                if (!abortController.signal.aborted) setLoading(false);
            }
        };

        loadInitial();

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = subscribeToClubAnnouncements(clubId, {
            onInsertBroadcast: (payload) => {
                if (abortController.signal.aborted) return;
                processedIds.current.add(payload.announcementId);
                appendMessage(payload);
            },
            onPostgresFallback: (payload) => {
                if (abortController.signal.aborted) return;
                if (processedIds.current.has(payload.new.announcementId)) return;

                setTimeout(() => {
                    if (abortController.signal.aborted || processedIds.current.has(payload.new.announcementId)) return;

                    fetchSingleAnnouncement(payload.new.announcementId).then(data => {
                        if (data && !abortController.signal.aborted) {
                            processedIds.current.add(data.announcementId);
                            appendMessage(data);
                        }
                    }).catch(() => console.warn("Fallback fetch failed."));
                }, 2000);
            },
            onUpdate: (updatedRow) => {
                if (abortController.signal.aborted) return;
                if (updatedRow.is_deleted) {
                    setMessages(prev => prev.filter(m => m.announcementId !== updatedRow.announcementId));
                } else {
                    setMessages(prev => prev.map(m => m.announcementId === updatedRow.announcementId
                        ? { ...m, message: updatedRow.message, updatedAt: updatedRow.updatedAt }
                        : m
                    ));
                }
            }
        });

        channelRef.current = channel;

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
            abortController.abort();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [clubId]);

    const fetchOlderMessages = async () => {
        if (!hasMore || fetchingMore || messages.length === 0) return;

        setFetchingMore(true);
        const oldestMessage = messages[0];
        try {
            const olderMessages = await fetchAnnouncements(clubId, oldestMessage.createdAt, FETCH_LIMIT);
            if (olderMessages.length < FETCH_LIMIT) setHasMore(false);

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.announcementId));
                const newUniqueMessages = olderMessages.reverse().filter(m => !existingIds.has(m.announcementId));
                return [...newUniqueMessages, ...prev];
            });
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load older messages" });
        } finally {
            setFetchingMore(false);
        }
    };

    const handleSend = async () => {
        const textToPost = inputValue.trim();
        const activeId = roleType === "student" ? studentId : facultyId;
        if (!textToPost || textToPost.length > 1000 || isPosting || !activeId) return;

        setIsPosting(true);

        try {
            if (editingId) {
                await updateAnnouncement(editingId, textToPost);
                setMessages(prev => prev.map(m => m.announcementId === editingId
                    ? { ...m, message: textToPost, updatedAt: new Date().toISOString() }
                    : m
                ));
                setEditingId(null);
                Toast.show({ type: "success", text1: "Announcement updated" });
                setInputValue("");
            } else {
                const newMessage = await postAnnouncement(
                    clubId, 
                    collegeId, 
                    userRole, 
                    textToPost,
                    { type: roleType, id: activeId! }
                );
                processedIds.current.add(newMessage.announcementId);
                appendMessage(newMessage);
                setInputValue("");
            }
        } catch (err: any) {
            console.error("Failed to send message:", err);
            Toast.show({ type: "error", text1: "Failed to send message", text2: err?.message || "Unknown error occurred" });
        } finally {
            setIsPosting(false);
        }
    };

    const confirmDelete = async (id: number) => {
        try {
            await deleteAnnouncement(id);
            setMessages(prev => prev.filter(m => m.announcementId !== id));
            Toast.show({ type: "success", text1: "Announcement deleted" });
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to delete" });
        }
    };

    const showOptions = (announcement: any) => {
        Alert.alert(
            "Options",
            "What would you like to do?",
            [
                { text: "Edit", onPress: () => { setEditingId(announcement.announcementId); setInputValue(announcement.message); } },
                { text: "Delete", onPress: () => confirmDelete(announcement.announcementId), style: "destructive" },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const getAuthorDetails = (announcement: any) => {
        if (announcement.authorStudent) {
            const profile = Array.isArray(announcement.authorStudent.users?.user_profile)
                ? announcement.authorStudent.users?.user_profile[0]
                : announcement.authorStudent.users?.user_profile;
            return { name: announcement.authorStudent.users?.fullName, avatar: profile?.profileUrl };
        }
        if (announcement.authorFaculty) {
            const profile = Array.isArray(announcement.authorFaculty.users?.user_profile)
                ? announcement.authorFaculty.users?.user_profile[0]
                : announcement.authorFaculty.users?.user_profile;
            return { name: announcement.authorFaculty.users?.fullName, avatar: profile?.profileUrl };
        }
        return { name: "Unknown", avatar: null };
    };

    if (loading) {
        return (
            <View style={tw`flex-1 items-center justify-center`}>
                <ActivityIndicator size="large" color="#43C17A" />
            </View>
        );
    }

    
    const canPost = ["president", "vicepresident", "mentor", "responsiblefaculty"].includes(userRole.toLowerCase());

    return (
        <KeyboardAvoidingView 
            style={tw`flex-1`} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <ScrollView 
                style={tw`flex-1 px-4`}
                contentContainerStyle={tw`pb-4 pt-4`}
                onScroll={({ nativeEvent }) => {
                    if (nativeEvent.contentOffset.y <= 10) {
                        fetchOlderMessages();
                    }
                }}
                scrollEventThrottle={400}
            >
                {messages.length === 0 ? (
                    <View style={tw`flex-1 items-center justify-center pt-20`}>
                        <View style={tw`bg-[#16284F]/10 p-4 rounded-full mb-4`}>
                            <Text style={tw`text-4xl`}>📢</Text>
                        </View>
                        <Text style={tw`text-lg font-bold text-[#16284F] mb-1`}>No Announcements Yet</Text>
                        <Text style={tw`text-sm text-gray-500 text-center px-6`}>
                            Be the first to share an update or important information with the club members!
                        </Text>
                    </View>
                ) : (
                    <>
                        {hasMore && (
                            <View style={tw`items-center py-2`}>
                                <TouchableOpacity onPress={fetchOlderMessages} disabled={fetchingMore}>
                                    <Text style={tw`text-xs font-bold text-gray-400 py-2 px-4 rounded-full bg-gray-50 border border-gray-200`}>
                                        {fetchingMore ? "Loading..." : "Load older messages"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {messages.map((announcement) => {
                            const authorInfo = getAuthorDetails(announcement);
                            const isMyMessage = (roleType === "faculty" && announcement.authorFacultyId === facultyId) || 
                                                (roleType === "student" && announcement.authorStudentId === studentId);

                            return (
                                <View key={announcement.announcementId} style={tw`flex-row mb-4 items-start`}>
                                    <View style={tw`flex-1 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 mr-3`}>
                                        
                                        {isMyMessage && (
                                            <TouchableOpacity 
                                                style={tw`absolute top-3 right-2 p-2 z-10`}
                                                onPress={() => showOptions(announcement)}
                                            >
                                                <DotsThreeVertical size={20} color="#9ca3af" weight="bold" />
                                            </TouchableOpacity>
                                        )}

                                        <View style={tw`mb-2 pr-8`}>
                                            <Text style={tw`text-[11px] font-medium text-gray-400 mb-1`}>
                                                {formatChatDateTime(announcement.createdAt)}
                                            </Text>
                                            <View style={tw`flex-row items-center flex-wrap`}>
                                                <View style={tw`rounded bg-[#E0E5FA] px-1.5 py-0.5 border border-[#465FAC] mr-2`}>
                                                    <Text style={tw`text-[10px] font-bold text-[#16284F]`}>
                                                        {announcement.authorRole}
                                                    </Text>
                                                </View>
                                                <Text style={tw`text-[13px] font-bold text-[#16284F]`}>
                                                    {authorInfo.name}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={tw`text-[14px] font-medium leading-5 text-[#16284F]`}>
                                            {announcement.message}
                                        </Text>
                                        {announcement.updatedAt && new Date(announcement.updatedAt).getTime() > new Date(announcement.createdAt).getTime() + 1000 && (
                                            <Text style={tw`text-[10px] font-bold text-gray-400 text-right mt-1`}>Edited</Text>
                                        )}
                                    </View>
                                    <View style={tw`w-10 h-10 rounded-full bg-gray-100 overflow-hidden`}>
                                        <Avatar src={authorInfo.avatar} size={40} />
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            {canPost && (
                <View style={[tw`p-4 bg-[#F4F5F6]`, { paddingBottom: isKeyboardVisible ? (Platform.OS === 'android' ? keyboardHeight : 16) : Math.max(insets.bottom, 16) }]}>
                    <View style={tw`flex-row items-center bg-[#E5E5E5] rounded-full px-4 py-2`}>
                        <TextInput
                            value={inputValue}
                            onChangeText={setInputValue}
                            placeholder={editingId ? "Edit announcement..." : "Type here........"}
                            placeholderTextColor="#6F6F6F"
                            maxLength={1000}
                            style={tw`flex-1 text-sm font-medium text-[#282828] py-2`}
                            multiline
                        />
                        {editingId && (
                            <TouchableOpacity onPress={() => { setEditingId(null); setInputValue(""); }} style={tw`mr-3`}>
                                <Text style={tw`text-xs text-red-500 font-bold`}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            disabled={!inputValue.trim() || isPosting}
                            onPress={handleSend}
                            style={tw`h-10 w-10 items-center justify-center rounded-full ${!inputValue.trim() || isPosting ? 'bg-gray-400' : 'bg-[#16284F]'}`}
                        >
                            {isPosting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <PaperPlaneRight size={20} color="#FFF" weight="fill" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={tw`text-[10px] text-right mt-1 px-4 ${inputValue.length >= 1000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                        {inputValue.length}/1000
                    </Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}
