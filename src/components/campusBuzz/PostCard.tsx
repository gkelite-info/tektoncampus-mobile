import { Text } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, TextInput, ActivityIndicator, Linking } from 'react-native';
import { Heart, ChatCircle, ShareNetwork, DotsThree, Trash, PencilSimple, PaperPlaneRight, X, Link as LinkIcon, Check } from 'phosphor-react-native';
import { checkCampusBuzzPostLiked, fetchCampusBuzzPostLikeCount, toggleCampusBuzzPostLike } from '@/lib/helpers/campusBuzz/campusBuzzPostLikesAPI';
import { fetchCampusBuzzPostCommentCount, fetchCampusBuzzPostComments, addCampusBuzzPostComment, updateCampusBuzzPostComment, deleteCampusBuzzPostComment } from '@/lib/helpers/campusBuzz/campusBuzzPostCommentsAPI';
import { fetchCampusBuzzPostShareCount, shareCampusBuzzPost } from '@/lib/helpers/campusBuzz/campusBuzzPostSharesAPI';
import { sendUniversalNotifications } from '@/lib/helpers/notifications/notificationAPI';
import { useTranslation } from 'react-i18next';
const getAvatarStyle = (userId: number) => ({
  backgroundColor: `hsl(${userId * 137.508 % 360}, 65%, 45%)`
});
const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
const formatTimeAgo = (dateString: string, t: any) => {

  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return t("Just now", "Just now");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t("m ago", "m ago")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t("h ago", "h ago")}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${t("d ago", "d ago")}`;
  return new Date(dateString).toLocaleDateString();
};
const RoleFlair = ({
  role
}: {
  role?: string;
}) => {
  if (!role) return null;
  const isStaff = ["Faculty", "Admin", "CollegeAdmin", "CollegeHr", "SuperAdmin"].includes(role);
  return <View className={`px-2 py-0.5 rounded-full border ${isStaff ? "bg-blue-50 border-blue-100" : "bg-gray-100 border-gray-200"}`}>
            <Text className={`text-[9px] font-medium ${isStaff ? "text-blue-600" : "text-gray-600"}`}>{role}</Text>
        </View>;
};
const extractProfileUrl = (userObj: any) => {
  if (!userObj?.user_profile) return null;
  return Array.isArray(userObj.user_profile) ? userObj.user_profile[0]?.profileUrl : userObj.user_profile.profileUrl;
};
const UserAvatar = ({
  userId,
  name,
  photoUrl,
  size = 40
}: {
  userId: number;
  name?: string;
  photoUrl?: string | null;
  size?: number;
}) => {
  if (photoUrl) {
    return <Image source={{
      uri: photoUrl
    }} style={{
      width: size,
      height: size,
      borderRadius: size / 2
    }} className="border border-gray-100" />;
  }
  return <View style={[{
    width: size,
    height: size,
    borderRadius: size / 2
  }, getAvatarStyle(userId)]} className="items-center justify-center shadow-inner">
            <Text className="text-white font-bold" style={{
      fontSize: size * 0.4
    }}>{getInitials(name)}</Text>
        </View>;
};
export default function PostCard({
  post,
  userId,
  fullName,
  currentUserPhoto,
  isHighlighted,
  debouncedSearch,
  onEditPost,
  onDeletePost
}: any) {
  const {
    t
  } = useTranslation("CampusBuzz");
  const pId = post.campusBuzzPostId;
  const tagArray = Array.isArray(post.tags) ? post.tags : typeof post.tags === 'string' ? post.tags.split(',').map((t: string) => t.trim()) : [];
  const postAuthorPhoto = extractProfileUrl(post.users);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [commentsActive, setCommentsActive] = useState(isHighlighted || false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharedActive, setSharedActive] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: number;
    userName: string;
  } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  useEffect(() => {
    Promise.all([fetchCampusBuzzPostLikeCount(pId), checkCampusBuzzPostLiked(pId, userId), fetchCampusBuzzPostCommentCount(pId), fetchCampusBuzzPostShareCount(pId)]).then(([lCount, uLiked, cCount, sCount]) => {
      setLikeCount(lCount);
      setLiked(uLiked?.liked || false);
      setCommentCount(cCount);
      setShareCount(sCount);
    });
    if (isHighlighted) loadComments();
  }, [pId, userId, isHighlighted]);
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await fetchCampusBuzzPostComments(pId);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  const handleToggleLike = async () => {
    if (!userId) return;
    const isCurrentlyLiked = liked;
    setLiked(!isCurrentlyLiked);
    setLikeCount(isCurrentlyLiked ? Math.max(0, likeCount - 1) : likeCount + 1);
    try {
      const res = await toggleCampusBuzzPostLike(pId, userId);
      if (res.success && !isCurrentlyLiked && post.createdBy !== userId) {
        await sendUniversalNotifications({
          userIds: [post.createdBy],
          title: "New Like on Campus Buzz",
          message: `${fullName} liked your post.`,
          type: "Announcement",
          referenceId: pId
        });
      }
    } catch (err) {
      setLiked(isCurrentlyLiked);
      setLikeCount(isCurrentlyLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
    }
  };
  const handleToggleComments = () => {
    const willBeActive = !commentsActive;
    setCommentsActive(willBeActive);
    if (willBeActive && comments.length === 0) {
      loadComments();
    }
  };
  const handleSubmitComment = async () => {
    if (!userId || !newCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await addCampusBuzzPostComment({
        campusBuzzPostId: pId,
        comment: newCommentText,
        parentCommentId: replyingTo?.commentId || null
      }, userId);
      if (res.success) {
        await loadComments();
        setCommentCount(prev => prev + 1);
        setNewCommentText("");
        setReplyingTo(null);
        if (post.createdBy !== userId) {
          await sendUniversalNotifications({
            userIds: [post.createdBy],
            title: "New Comment",
            message: `${fullName} commented: "${newCommentText.substring(0, 30)}..."`,
            type: "Announcement",
            referenceId: pId
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  const handleEditCommentSubmit = async (commentId: number) => {
    if (!editingCommentText.trim()) return;
    const res = await updateCampusBuzzPostComment(commentId, editingCommentText);
    if (res.success) {
      setComments(prev => prev.map(c => c.campusBuzzPostCommentId === commentId ? {
        ...c,
        comment: editingCommentText
      } : c));
      setEditingCommentId(null);
    }
  };
  const handleDeleteComment = async (commentId: number) => {
    const res = await deleteCampusBuzzPostComment(commentId);
    if (res.success) {
      setComments(prev => prev.filter(c => c.campusBuzzPostCommentId !== commentId));
      setCommentCount(prev => Math.max(0, prev - 1));
    }
  };
  const handleShareAction = async (platform: string) => {
    const postUrl = `https://tektoncampus.com/buzz?post=${pId}`;
    if (platform === "whatsapp") {
      Linking.openURL(`https://api.whatsapp.com/send?text=Check out this update on Campus Buzz: ${encodeURIComponent(postUrl)}`);
    }
    const res = await shareCampusBuzzPost({
      campusBuzzPostId: pId,
      sharedTo: platform
    }, userId);
    if (res.isNewShare) setShareCount(prev => prev + 1);
    setSharedActive(false);
  };
  const parentComments = comments.filter(c => !c.parentCommentId);
  return <View className={`bg-white rounded-xl border mb-4 shadow-sm ${isHighlighted && !debouncedSearch ? "border-[#43C17A] bg-[#fafffb]" : "border-gray-100"}`}>
            <View className="p-4">
                {}
                <View className="flex-row justify-between items-start mb-3 relative z-10">
                    <View className="flex-row items-center gap-3">
                        <UserAvatar userId={post.createdBy} name={post.users?.fullName} photoUrl={postAuthorPhoto} size={40} />
                        <View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-[15px] font-semibold text-[#282828]">{post.users?.fullName || "Campus Member"}</Text>
                                <RoleFlair role={post.users?.role} />
                            </View>
                            <Text className="text-[12px] text-gray-400 mt-0.5">{formatTimeAgo(post.createdAt, t)}</Text>
                        </View>
                    </View>

                    {post.createdBy === userId && <View className="relative">
                            <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-full">
                                <DotsThree size={24} color="#6B7280" weight="bold" />
                            </TouchableOpacity>
                            
                            {menuOpen && <View className="absolute right-0 top-8 bg-white border border-gray-100 rounded-lg shadow-lg w-32 py-1 z-[999] elevation-5">
                                    <TouchableOpacity onPress={() => {
              setMenuOpen(false);
              onEditPost(post);
            }} className="flex-row items-center px-4 py-2.5 gap-2 border-b border-gray-50">
                                        <PencilSimple size={16} color="#374151" />
                                        <Text className="text-gray-700 text-sm font-medium">{t("Edit", "Edit")}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
              setMenuOpen(false);
              onDeletePost(pId);
            }} className="flex-row items-center px-4 py-2.5 gap-2">
                                        <Trash size={16} color="#DC2626" />
                                        <Text className="text-red-600 text-sm font-medium">{t("Delete", "Delete")}</Text>
                                    </TouchableOpacity>
                                </View>}
                        </View>}
                </View>

                {}
                <Text className="text-[16px] font-semibold text-[#282828] mb-1">{post.title}</Text>
                <Text className="text-[14px] text-gray-700 leading-5">{post.description}</Text>

                {tagArray.length > 0 && <View className="flex-row flex-wrap gap-2 mt-3">
                        {tagArray.map((tag: string, i: number) => <View key={i} className="bg-[#EAF7F1] px-2.5 py-1 rounded-md">
                                <Text className="text-[11px] text-[#43C17A] font-medium">{tag}</Text>
                            </View>)}
                    </View>}

                {post.imageUrl && <View className="mt-3 w-full h-[220px] bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        <Image source={{
          uri: post.imageUrl
        }} className="w-full h-full" resizeMode="cover" />
                    </View>}

                {}
                <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-50">
                    <View className="flex-row gap-4">
                        <TouchableOpacity onPress={handleToggleLike} className="flex-row items-center gap-1.5 p-1">
                            <Heart size={20} color={liked ? "#EF4444" : "#6B7280"} weight={liked ? "fill" : "regular"} />
                            <Text className={`text-sm font-medium ${liked ? "text-red-500" : "text-gray-600"}`}>{likeCount}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handleToggleComments} className="flex-row items-center gap-1.5 p-1">
                            <ChatCircle size={20} color={commentsActive ? "#43C17A" : "#6B7280"} weight={commentsActive ? "fill" : "regular"} />
                            <Text className={`text-sm font-medium ${commentsActive ? "text-[#43C17A]" : "text-gray-600"}`}>{commentCount}</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="relative">
                        <TouchableOpacity onPress={() => setSharedActive(!sharedActive)} className="flex-row items-center gap-1.5 p-1">
                            <ShareNetwork size={20} color="#6B7280" />
                            <Text className="text-sm font-medium text-gray-600">{shareCount > 0 ? `${shareCount} ${t("Shares", "Shares")}` : t("Share", "Share")}</Text>
                        </TouchableOpacity>

                        {sharedActive && <View className="absolute right-0 bottom-8 bg-white border border-gray-100 rounded-lg shadow-lg w-[180px] py-1 z-[999] elevation-5">
                                <TouchableOpacity onPress={() => handleShareAction("whatsapp")} className="flex-row items-center px-4 py-3 gap-2">
                                    <ShareNetwork size={16} color="#43C17A" />
                                    <Text className="text-gray-700 text-sm font-medium text-[#43C17A]">{t("Share to WhatsApp", "Share to WhatsApp")}</Text>
                                </TouchableOpacity>
                            </View>}
                    </View>
                </View>

                {}
                {commentsActive && <View className="mt-4 pt-3 border-t border-gray-50 flex-col gap-3">
                        {replyingTo && <View className="flex-row justify-between items-center bg-gray-100 px-3 py-1.5 rounded-lg mb-1">
                                <Text className="text-xs text-gray-600">
                                    {t("Replying to", "Replying to")} <Text className="font-semibold text-gray-800">{replyingTo.userName}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                    <X size={14} color="#6B7280" />
                                </TouchableOpacity>
                            </View>}

                        <View className="flex-row items-center gap-2">
                            <UserAvatar userId={userId!} name={fullName!} photoUrl={currentUserPhoto} size={32} />
                            <TextInput placeholder={replyingTo ? t("Write a reply...", "Write a reply...") : t("Write a comment...", "Write a comment...")} placeholderTextColor="#9CA3AF" value={newCommentText} onChangeText={setNewCommentText} className="flex-1 h-10 px-4 bg-gray-100 rounded-full text-sm text-[#282828]" />
                            <TouchableOpacity onPress={handleSubmitComment} disabled={isSubmittingComment || !newCommentText.trim()} className={`w-10 h-10 rounded-full items-center justify-center ${newCommentText.trim() ? "bg-[#43C17A]" : "bg-gray-300"}`}>
                                <PaperPlaneRight size={16} color="white" weight="fill" />
                            </TouchableOpacity>
                        </View>

                        {isLoadingComments ? <ActivityIndicator size="small" color="#43C17A" className="my-4" /> : parentComments.length === 0 ? <Text className="text-center text-xs text-gray-400 py-2">{t("No comments yet", "No comments yet")}</Text> : <View className="mt-2 flex-col gap-3">
                                {parentComments.map((comment: any) => {
            const replies = comments.filter(c => c.parentCommentId === comment.campusBuzzPostCommentId);
            const renderComment = (c: any, isReply = false) => {
              
              return <View key={c.campusBuzzPostCommentId} className={`flex-row gap-2 ${isReply ? "mt-3" : ""}`}>
                                            <UserAvatar userId={c.commentedBy} name={c.users?.fullName} photoUrl={extractProfileUrl(c.users)} size={isReply ? 24 : 32} />
                                            <View className="flex-1">
                                                <View className="flex-row justify-between items-start">
                                                    <View className="bg-gray-100 px-3 py-2 rounded-2xl rounded-tl-none pr-8">
                                                        <View className="flex-row items-center gap-1.5 mb-0.5">
                                                            <Text className={`font-semibold text-[#282828] ${isReply ? "text-[11px]" : "text-xs"}`}>{c.users?.fullName || "Member"}</Text>
                                                            <RoleFlair role={c.users?.role} />
                                                        </View>
                                                        
                                                        {editingCommentId === c.campusBuzzPostCommentId ? <View className="mt-1">
                                                                <TextInput value={editingCommentText} onChangeText={setEditingCommentText} className="bg-white px-2 py-1 text-xs border border-gray-200 rounded" autoFocus />
                                                                <View className="flex-row gap-2 mt-1">
                                                                    <TouchableOpacity onPress={() => handleEditCommentSubmit(c.campusBuzzPostCommentId)}>
                                                                        <Text className="text-[10px] text-[#43C17A] font-bold">{t("Save", "Save")}</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity onPress={() => setEditingCommentId(null)}>
                                                                        <Text className="text-[10px] text-gray-500 font-bold">{t("Cancel", "Cancel")}</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View> : <Text className={`text-[#1c1e21] ${isReply ? "text-[12px]" : "text-[13px]"}`}>{c.comment}</Text>}
                                                    </View>

                                                    {c.commentedBy === userId && editingCommentId !== c.campusBuzzPostCommentId && <TouchableOpacity onPress={() => activeCommentMenuId === c.campusBuzzPostCommentId ? setActiveCommentMenuId(null) : setActiveCommentMenuId(c.campusBuzzPostCommentId)} className="p-1">
                                                            <DotsThree size={16} color="#9CA3AF" weight="bold" />
                                                        </TouchableOpacity>}
                                                </View>

                                                {}
                                                {activeCommentMenuId === c.campusBuzzPostCommentId && <View className="flex-row gap-3 mt-1 ml-1 bg-white px-2 py-1 rounded shadow-sm border border-gray-100 self-start">
                                                        <TouchableOpacity onPress={() => {
                      setEditingCommentId(c.campusBuzzPostCommentId);
                      setEditingCommentText(c.comment);
                      setActiveCommentMenuId(null);
                    }}>
                                                            <Text className="text-[10px] text-gray-700">{t("Edit", "Edit")}</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => {
                      handleDeleteComment(c.campusBuzzPostCommentId);
                      setActiveCommentMenuId(null);
                    }}>
                                                            <Text className="text-[10px] text-red-500">{t("Delete", "Delete")}</Text>
                                                        </TouchableOpacity>
                                                    </View>}

                                                {editingCommentId !== c.campusBuzzPostCommentId && <View className="flex-row items-center gap-3 px-1 mt-1">
                                                        <Text className="text-[10px] text-gray-500">{formatTimeAgo(c.createdAt, t)}</Text>
                                                        {!isReply && <TouchableOpacity onPress={() => setReplyingTo({
                      commentId: c.campusBuzzPostCommentId,
                      userName: c.users?.fullName || "Member"
                    })}>
                                                                <Text className="text-[10px] font-semibold text-gray-600">{t("Reply", "Reply")}</Text>
                                                            </TouchableOpacity>}
                                                    </View>}
                                            </View>
                                        </View>;
            };
            return <View key={comment.campusBuzzPostCommentId} className="flex-col gap-1 mb-2">
                                            {renderComment(comment, false)}
                                            {replies.length > 0 && <View className="pl-4 ml-4 border-l-2 border-gray-100">
                                                    {replies.map(reply => renderComment(reply, true))}
                                                </View>}
                                        </View>;
          })}
                            </View>}
                    </View>}
            </View>
        </View>;
}