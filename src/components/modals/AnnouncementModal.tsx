import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Platform, FlatList, TextInput, ScrollView, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Megaphone, X, MagnifyingGlass, Plus } from 'phosphor-react-native';
import { useUser } from '@/utils/context/UserContext';
import { fetchCampusBuzzFeed, deactivateCampusBuzzPost } from '@/lib/helpers/campusBuzz/campusBuzzAPI';
import PostCard from '@/components/campusBuzz/PostCard';
import AddPostModal from '@/components/campusBuzz/AddPostModal';
import { useTranslation } from 'react-i18next';
import Shimmer from '@/components/ui/Shimmer';

type Props = {
    visible: boolean;
    onClose: () => void;
    highlightedPostId?: number;
};

const TABS = ["All", "Achievements", "Announcements", "Clubs & Activities"];
const POSTS_PER_PAGE = 10;

export default function AnnouncementModal({ visible, onClose, highlightedPostId }: Props) {
    const { t } = useTranslation("CampusBuzz");
    const { collegeId, userId, fullName, profilePhoto } = useUser();

    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(TABS[0]);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [isAddPostOpen, setIsAddPostOpen] = useState(false);
    const [editPostData, setEditPostData] = useState<any>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadPosts = async (pageNumber = 0, isRefresh = false) => {
        if (!collegeId) return;
        isRefresh ? setIsLoading(true) : setIsLoadingMore(true);

        try {
            const data = await fetchCampusBuzzFeed(collegeId, pageNumber, POSTS_PER_PAGE, debouncedSearch);

            setHasMore(data.length >= POSTS_PER_PAGE);

            let sortedData = isRefresh ? data : [...posts, ...data];

            if (highlightedPostId && isRefresh && !debouncedSearch) {
                sortedData = [...sortedData].sort((a, b) => {
                    if (a.campusBuzzPostId === highlightedPostId) return -1;
                    if (b.campusBuzzPostId === highlightedPostId) return 1;
                    return 0;
                });
            }
            setPosts(sortedData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (visible) {
            setPage(0);
            loadPosts(0, true);
        }
    }, [visible, debouncedSearch, collegeId, highlightedPostId]);

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadPosts(nextPage, false);
    };

    const confirmDeletePost = (postId: number) => {
        Alert.alert(
            t("Delete Post", "Delete Post"),
            t("Are you sure you want to delete this post?", "Are you sure you want to delete this post? This action cannot be undone."),
            [
                { text: t("Cancel", "Cancel"), style: "cancel" },
                { 
                    text: t("Delete", "Delete"), 
                    style: "destructive",
                    onPress: async () => {
                        setIsDeletingPost(true);
                        try {
                            const res = await deactivateCampusBuzzPost(postId);
                            if (res.success) {
                                setPosts((prev) => prev.filter((p) => p.campusBuzzPostId !== postId));
                            }
                        } catch (error) {
                            console.error(error);
                        } finally {
                            setIsDeletingPost(false);
                        }
                    }
                }
            ]
        );
    };

    const filteredPosts = posts.filter((post) => {
        if (activeTab === "All") return true;
        if (activeTab === "Achievements" && post.category === "achievements") return true;
        if (activeTab === "Announcements" && post.category === "announcements") return true;
        if (activeTab === "Clubs & Activities" && post.category === "clubactivities") return true;
        return false;
    });

    const renderHeader = () => (
        <View className="bg-white">
            <View className="px-4 mt-4">
                <View className="flex-row items-center bg-[#ECECEC] h-[45px] rounded-full px-4">
                    <TextInput 
                        placeholder={t("Search posts or announcements", "Search posts or announcements")}
                        placeholderTextColor="#6B7280"
                        value={searchInput}
                        onChangeText={setSearchInput}
                        className="flex-1 text-[#282828] text-base"
                    />
                    <MagnifyingGlass size={20} color="#43C17A" />
                </View>
            </View>

            <View className="mt-4 border-b border-gray-100">
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    className="px-4 pb-3"
                    contentContainerStyle={{ gap: 8 }}
                >
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`px-5 h-[32px] rounded-full items-center justify-center transition-colors border ${activeTab === tab ? "bg-[#43C17A] border-[#43C17A]" : "bg-[#EAF7F1] border-[#EAF7F1]"}`}
                        >
                            <Text className={`text-sm font-medium ${activeTab === tab ? "text-white" : "text-[#43C17A]"}`}>{t(tab, tab)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (isLoadingMore) {
            return (
                <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#43C17A" />
                </View>
            );
        }
        return null;
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "fullScreen"} 
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
                    <View className="flex-row items-center gap-2">
                        <Megaphone size={24} weight="fill" color="#43C17A" />
                        <Text className="font-semibold text-xl text-[#282828]">{t("Campus Buzz", "Campus Buzz")}</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity 
                            onPress={() => { setEditPostData(null); setIsAddPostOpen(true); }}
                            className="flex-row items-center gap-1 bg-[#EAF7F1] px-3 py-1.5 rounded-full"
                        >
                            <Plus size={14} color="#43C17A" weight="bold" />
                            <Text className="text-[#43C17A] font-medium text-sm">{t("Post", "Post")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={onClose}
                            className="p-1.5 rounded-full bg-gray-50"
                        >
                            <X size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {renderHeader()}
                
                {isLoading ? (
                    <View className="flex-1 px-4 pt-4">
                        {[1, 2, 3].map(i => (
                            <View key={i} className="mb-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                <View className="flex-row items-center gap-3 mb-3">
                                    <Shimmer width={40} height={40} borderRadius={20} />
                                    <View className="flex-col gap-2">
                                        <Shimmer width={120} height={16} />
                                        <Shimmer width={80} height={12} />
                                    </View>
                                </View>
                                <Shimmer width="100%" height={16} className="mb-2" />
                                <Shimmer width="80%" height={16} className="mb-4" />
                                <Shimmer width="100%" height={200} borderRadius={12} className="mb-4" />
                                <View className="flex-row gap-4 border-t border-gray-50 pt-3">
                                    <Shimmer width={60} height={20} />
                                    <Shimmer width={60} height={20} />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <FlatList 
                        data={filteredPosts}
                        keyExtractor={(item) => item.campusBuzzPostId.toString()}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={() => (
                            <View className="flex-1 items-center justify-center pt-20">
                                <Megaphone size={48} color="#D1D5DB" weight="fill" />
                                <Text className="text-gray-500 mt-4 text-center px-8">
                                    {debouncedSearch ? t("No matching posts found.", "No matching posts found.") : t("No posts found. Be the first to share!", "No posts found. Be the first to share!")}
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View className="px-4 pt-4">
                                <PostCard 
                                    post={item}
                                    userId={userId}
                                    fullName={fullName}
                                    currentUserPhoto={profilePhoto}
                                    debouncedSearch={debouncedSearch}
                                    isHighlighted={highlightedPostId === item.campusBuzzPostId}
                                    onEditPost={(p: any) => { setEditPostData(p); setIsAddPostOpen(true); }}
                                    onDeletePost={confirmDeletePost}
                                />
                            </View>
                        )}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        onScrollBeginDrag={Keyboard.dismiss}
                    />
                )}

                <AddPostModal 
                    visible={isAddPostOpen} 
                    onClose={() => setIsAddPostOpen(false)} 
                    editData={editPostData}
                    onSuccess={() => loadPosts(0, true)}
                />
            </SafeAreaView>
        </Modal>
    );
}
