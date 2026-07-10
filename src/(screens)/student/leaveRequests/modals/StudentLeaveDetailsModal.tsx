import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, FlatList, Image, Linking, ActivityIndicator, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Paperclip, PaperPlaneRight, CalendarBlank, FilePdf, Checks, PencilSimple, Trash, Check } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabaseClient';
import { Avatar } from '@/components/Avatar';
import ConfirmDeleteModal from './ConfirmDeleteModal';

import {
  fetchLeaveChatHistory,
  sendLeaveChatMessage,
  markMessagesAsRead,
  editLeaveChatMessage,
  deleteLeaveChatMessage,
  deleteLeaveChatMessages
} from '@/lib/helpers/student/leaveRequests/leaveChatAPI';

interface StudentLeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveData: any;
  currentStudentId: number;
}

export default function StudentLeaveDetailsModal({ isOpen, onClose, leaveData, currentStudentId }: StudentLeaveDetailsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const LIMIT = 10;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageIdToDelete, setMessageIdToDelete] = useState<number | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [activeMessageActionsId, setActiveMessageActionsId] = useState<number | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  useEffect(() => {
    if (isOpen && leaveData) {
      loadInitialHistory();
      setupRealtime();
      markMessagesAsRead(leaveData.id, "STUDENT");
    }
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [isOpen, leaveData]);

  const loadInitialHistory = async () => {
    setIsInitialLoading(true);
    try {
      const history = await fetchLeaveChatHistory(leaveData.id, 1, LIMIT);
      setMessages([...history].reverse());
      setPage(1);
      setHasMore(history.length === LIMIT);
    } catch (err) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Failed to load chat history', 'Failed to load chat history') });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const olderMessages = await fetchLeaveChatHistory(leaveData.id, nextPage, LIMIT);

      if (olderMessages.length > 0) {
        setMessages((prev) => {
          const newMsgs = olderMessages.filter((o: any) => !prev.some((p) => p.chatId === o.chatId));
          const reversedNewMsgs = [...newMsgs].reverse();
          return [...prev, ...reversedNewMsgs];
        });
        setPage(nextPage);
        setHasMore(olderMessages.length === LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.log('Failed to load more', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const reloadHistory = async () => {
    try {
      const history = await fetchLeaveChatHistory(leaveData.id, 1, page * LIMIT);
      setMessages([...history].reverse());
    } catch (err) {
      console.log('Failed to reload history', err);
    }
  };

  const setupRealtime = () => {
    const channel = supabase.channel(`leave_chat_${leaveData.id}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leave_request_chats", filter: `studentLeaveId=eq.${leaveData.id}` },
        async (payload) => {
          if (payload.new.senderRole !== "STUDENT") {
            reloadHistory();
            markMessagesAsRead(leaveData.id, "STUDENT");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leave_request_chats", filter: `studentLeaveId=eq.${leaveData.id}` },
        async () => { reloadHistory(); }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leave_request_chats", filter: `studentLeaveId=eq.${leaveData.id}` },
        (payload) => {
          const deletedChatId = payload.old.chatId;
          setMessages((prev) => prev.filter((m) => m.chatId !== deletedChatId));
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.role !== "STUDENT") {
          setIsTyping(payload.payload.isTyping);
        }
      })
      .subscribe();
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { role: "STUDENT", isTyping: true },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { role: "STUDENT", isTyping: false },
      });
    }, 2000);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    Keyboard.dismiss();

    const msgText = newMessage;
    const fileObj = selectedFile;
    setNewMessage('');
    setSelectedFile(null);
    setIsSending(true);

    try {
      let fileUrl: string | undefined = undefined;
      let fileType: string | undefined = undefined;

      if (fileObj) {
        const fileExt = fileObj.name.split('.').pop()?.toLowerCase();
        fileType = fileExt === 'pdf' ? 'pdf' : 'image';
        const fileName = `${leaveData.id}/${Date.now()}_${fileObj.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

        const fileData = await fetch(fileObj.uri).then((r) => r.blob());
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("leave_request_chats_attachments")
          .upload(fileName, fileData, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
          .from("leave_request_chats_attachments")
          .getPublicUrl(uploadData.path);
        fileUrl = urlData.publicUrl;
      }

      await sendLeaveChatMessage({
        studentLeaveId: leaveData.id,
        message: msgText,
        fileUrl,
        fileType,
        senderId: currentStudentId,
        senderRole: "STUDENT"
      });

      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { role: "STUDENT", isTyping: false },
      });

      reloadHistory();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Failed to send message', 'Failed to send message'), text2: err.message });
      setNewMessage(msgText);
      setSelectedFile(fileObj);
    } finally {
      setIsSending(false);
    }
  };

  const startEditingMessage = (msg: any) => {
    setEditingMessageId(msg.chatId);
    setEditingText(msg.message || "");
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleUpdateMessage = async (chatId: number) => {
    if (!editingText.trim()) return;

    setIsUpdatingMessage(true);
    try {
      const updatedMsg = await editLeaveChatMessage(chatId, editingText);
      if (updatedMsg) {
        setMessages((prev) => prev.map((m) => (m.chatId === chatId ? updatedMsg : m)));
      }
      cancelEditingMessage();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Failed to update message.', 'Failed to update message.') });
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  const initiateDeleteMessage = (chatId: number) => {
    setMessageIdToDelete(chatId);
    setIsDeleteModalOpen(true);
  };

  const initiateBulkDelete = () => {
    setIsBulkDelete(true);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMessage = async () => {
    setIsDeletingMessage(true);
    try {
      if (isBulkDelete) {
        await deleteLeaveChatMessages(selectedMessageIds);
        setMessages((prev) => prev.filter((m) => !selectedMessageIds.includes(m.chatId)));
        if (editingMessageId && selectedMessageIds.includes(editingMessageId)) {
          cancelEditingMessage();
        }
        Toast.show({ type: 'success', text1: t('LeaveRequests.student.Messages deleted successfully.', 'Messages deleted successfully.') });
        setIsSelectionMode(false);
        setSelectedMessageIds([]);
        setIsBulkDelete(false);
      } else if (messageIdToDelete !== null) {
        await deleteLeaveChatMessage(messageIdToDelete);
        setMessages((prev) => prev.filter((m) => m.chatId !== messageIdToDelete));
        if (editingMessageId === messageIdToDelete) cancelEditingMessage();
        setMessageIdToDelete(null);
        Toast.show({ type: 'success', text1: t('LeaveRequests.student.Message deleted successfully.', 'Message deleted successfully.') });
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Failed to delete message.', 'Failed to delete message.') });
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const formatChatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: {item: any;}) => {
    const isMe = item.senderRole === "STUDENT";
    const showNewBadge = !isMe && !item.isRead;
    const canEdit = isMe && !item.isRead && !!item.message;
    const canDelete = isMe && !item.isRead;
    const isEditing = editingMessageId === item.chatId;

    return (
      <View className={`flex-row gap-2 w-full mb-4 px-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {isSelectionMode && canDelete && (
          <TouchableOpacity 
            onPress={() => {
              setSelectedMessageIds((prev) =>
                prev.includes(item.chatId) ? prev.filter((id) => id !== item.chatId) : [...prev, item.chatId]
              );
            }}
            className="justify-center items-center mr-1"
          >
            <View className={`w-5 h-5 rounded border items-center justify-center ${selectedMessageIds.includes(item.chatId) ? 'bg-[#43C17A] border-[#43C17A]' : 'border-gray-300'}`}>
              {selectedMessageIds.includes(item.chatId) && <Check size={14} color="#FFF" weight="bold" />}
            </View>
          </TouchableOpacity>
        )}

        {!isMe && <Avatar src={item.senderAvatar} size={24} />}
        
        <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
          {!isMe && <Text className="text-[10px] font-bold text-[#43C17A] mb-1">{item.senderName}</Text>}
          
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => {
              if (isSelectionMode) return;
              if (canEdit || canDelete) {
                setActiveMessageActionsId(activeMessageActionsId === item.chatId ? null : item.chatId);
              }
            }}
            className={`px-3 py-2 rounded-2xl ${isMe ? 'bg-[#43C17A] rounded-tr-sm' : 'bg-white rounded-tl-sm border border-gray-200'}`}
          >
            {item.mediaUrl && (
              <View className="mb-2">
                {item.mediaType === 'image' ? (
                  <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl)}>
                    <Image source={{ uri: item.mediaUrl }} style={{ width: 150, height: 150, borderRadius: 8 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl)} className={`flex-row items-center gap-1.5 px-2 py-1.5 rounded-md ${isMe ? 'bg-black/10' : 'bg-gray-100'}`}>
                    <FilePdf size={16} color={isMe ? "#FFF" : "#282828"} weight="fill" />
                    <Text className={`text-[11px] font-bold underline ${isMe ? 'text-white' : 'text-[#282828]'}`}>{t("LeaveRequests.student.Document", "Document")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {isEditing ? (
              <View className="flex-row items-center gap-1 min-w-[120px]">
                <TextInput
                  value={editingText}
                  onChangeText={setEditingText}
                  className="flex-1 rounded border border-white/40 bg-white/10 px-2 py-1 text-[12px] text-white"
                  autoFocus
                />
                <TouchableOpacity onPress={() => handleUpdateMessage(item.chatId)} disabled={isUpdatingMessage || !editingText.trim()} className="bg-white/20 p-1.5 rounded-full">
                  <Check size={12} color="#FFF" weight="bold" />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEditingMessage} disabled={isUpdatingMessage} className="bg-white/20 p-1.5 rounded-full">
                  <X size={12} color="#FFF" weight="bold" />
                </TouchableOpacity>
              </View>
            ) : item.message ? (
              <Text className={`text-[13px] ${isMe ? 'text-white' : 'text-[#282828]'}`}>{item.message}</Text>
            ) : null}
          </TouchableOpacity>
          
          <View className="flex-row items-center gap-1.5 mt-1">
            {(canEdit || canDelete) && !isEditing && !isSelectionMode && activeMessageActionsId === item.chatId && (
              <View className="flex-row items-center gap-2 mr-2">
                {canEdit && (
                  <TouchableOpacity onPress={() => startEditingMessage(item)} className="p-1">
                    <PencilSimple size={14} color="#43C17A" weight="bold" />
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <TouchableOpacity onPress={() => initiateDeleteMessage(item.chatId)} className="p-1">
                    <Trash size={14} color="#FF4B4B" weight="bold" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text className="text-[9px] text-gray-400 font-medium">{formatChatTime(item.createdAt)}</Text>
            {showNewBadge && <View className="bg-[#D32F2F] px-1 rounded"><Text className="text-white text-[8px] font-bold uppercase">{t("LeaveRequests.student.New", "New")}</Text></View>}
            {isMe && <Checks size={12} color={item.isRead ? "#34B7F1" : "#D1D5DB"} weight="bold" />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black/40">
        <View 
          className="bg-[#F5F7FA] flex-1 rounded-t-3xl overflow-hidden shadow-2xl"
          style={{ marginTop: Math.max(insets.top + 10, 45) }}
        >
          
          {/* Header */}
          <View className="bg-white flex-row items-center justify-between p-4 border-b border-gray-100 shadow-sm z-10">
            <Text className="text-lg font-bold text-[#282828]">{t("LeaveRequests.student.leaveDetails", "Leave Details")}</Text>
            <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
              <X size={20} color="#525252" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Leave Info */}
          <View className="bg-white border-b border-gray-200 p-4 flex-row flex-wrap justify-between">
             <View className="items-center w-1/4 mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t("LeaveRequests.student.requestSent", "Request Sent")}</Text>
                <Text className="text-xs font-bold text-[#282828] text-center">{leaveData?.fromDate}</Text>
             </View>
             <View className="items-center w-1/4 mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t("LeaveRequests.student.duration", "Duration")}</Text>
                <Text className="text-xs font-bold text-[#282828] text-center" numberOfLines={2}>{leaveData?.fromDate} - {leaveData?.toDate}</Text>
             </View>
             <View className="items-center w-1/4 mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t("LeaveRequests.student.status", "Status")}</Text>
                <Text className={`text-xs font-bold capitalize ${leaveData?.status === "approved" ? "text-[#43C17A]" : leaveData?.status === "rejected" ? "text-red-500" : "text-orange-400"}`}>
                  {leaveData?.status === "approved" ? t("LeaveRequests.student.Approved", "Approved") : leaveData?.status === "rejected" ? t("LeaveRequests.student.Rejected", "Rejected") : t("LeaveRequests.student.Pending", "Pending")}
                </Text>
             </View>
             <View className="items-center w-1/4 mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t("LeaveRequests.student.leaveType", "Leave Type")}</Text>
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#43C17A]" />
                  <Text className="text-xs font-bold text-[#282828]">
                    {(leaveData?.leaveType || "").toLowerCase().replace(/[^a-z]/g, "") === 'leave' ? t("LeaveRequests.student.Leave", "Leave") : (leaveData?.leaveType || "").toLowerCase().replace(/[^a-z]/g, "") === 'attendanceregularization' ? t("LeaveRequests.student.attendanceRegularization", "Attendance Regularization") : leaveData?.leaveType}
                  </Text>
                </View>
             </View>
          </View>

          {/* Communication Header */}
          <View className="px-5 py-3 flex-row items-center justify-between bg-gray-50 border-b border-gray-100 z-10">
            <Text className="text-[13px] font-bold text-[#282828]">
              {isSelectionMode ? `${selectedMessageIds.length} ${t("LeaveRequests.student.selected", "Selected")}` : t("LeaveRequests.student.communicationHistory", "Communication History")}
            </Text>
            <View className="flex-row items-center gap-4">
              {isSelectionMode && selectedMessageIds.length > 0 && (
                <TouchableOpacity onPress={initiateBulkDelete} className="flex-row items-center gap-1">
                  <Trash size={14} color="#FF4B4B" weight="bold" />
                  <Text className="text-[#FF4B4B] text-xs font-bold">{t("LeaveRequests.student.deleteButton", "Delete")} ({selectedMessageIds.length})</Text>
                </TouchableOpacity>
              )}
              {(isSelectionMode || messages.some((msg) => msg.senderRole === "STUDENT" && !msg.isRead)) && (
                <TouchableOpacity onPress={() => { setIsSelectionMode(!isSelectionMode); setSelectedMessageIds([]); }}>
                  <Text className="text-[#43C17A] text-xs font-bold">{isSelectionMode ? t("LeaveRequests.student.cancel", "Cancel") : t("LeaveRequests.student.selectMessages", "Select Messages")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Chat List */}
          {isInitialLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#43C17A" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.chatId.toString()}
              renderItem={renderMessage}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              inverted={true}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.5}
              ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#9CA3AF" style={{ padding: 10 }} /> : null}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-10 scale-y-[-1]">
                  <Text className="text-gray-400 italic text-sm">{t("LeaveRequests.student.noCommunicationYet", "No communication yet.")}</Text>
                </View>
              }
            />
          )}

          {/* Typing / Sending indicators */}
          {(isTyping || isSending) && (
            <View className="px-4 py-2 bg-transparent absolute bottom-[70px] left-0 right-0">
              {isSending && (
                <View className="flex-row gap-2 self-end items-center opacity-70">
                  <View className="bg-[#43C17A] px-3 py-2 rounded-2xl rounded-tr-sm">
                    <Text className="text-white text-xs italic">{t("LeaveRequests.student.sending", "Sending...")}</Text>
                  </View>
                </View>
              )}
              {isTyping && (
                <View className="flex-row gap-2 self-start items-center opacity-70">
                  <View className="bg-white border border-gray-200 px-3 py-3 rounded-2xl rounded-tl-sm flex-row gap-1">
                    <View className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <View className="w-1.5 h-1.5 bg-gray-400 rounded-full opacity-70" />
                    <View className="w-1.5 h-1.5 bg-gray-400 rounded-full opacity-40" />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Input Area */}
          <View className="bg-white p-3 border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            {selectedFile && (
              <View className="flex-row items-center bg-gray-100 rounded-lg p-2 mb-2 self-start border border-gray-200 max-w-[200px]">
                <Paperclip size={14} color="#6B7280" />
                <Text className="text-xs text-gray-700 ml-1 flex-1 truncate" numberOfLines={1}>{selectedFile.name}</Text>
                <TouchableOpacity onPress={() => setSelectedFile(null)} className="ml-2">
                  <X size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            <View className="flex-row items-center gap-2 bg-[#F8F9FA] border border-gray-200 rounded-full px-3 py-1">
              <TouchableOpacity onPress={handlePickFile} className="p-2">
                <Paperclip size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TextInput
                value={newMessage}
                onChangeText={handleTyping}
                placeholder={t("LeaveRequests.student.typeYourMessage", "Type your message")}
                placeholderTextColor="#9CA3AF"
                className="flex-1 h-10 text-sm text-[#282828]"
                multiline
                maxLength={500}
                editable={!isSending}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={isSending || (!newMessage.trim() && !selectedFile)}
                className={`p-2.5 rounded-full ${(!newMessage.trim() && !selectedFile) ? 'bg-gray-200' : 'bg-[#43C17A]'}`}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <PaperPlaneRight size={16} color="#FFF" weight="fill" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onConfirm={confirmDeleteMessage}
        onCancel={() => { setIsDeleteModalOpen(false); setMessageIdToDelete(null); setIsBulkDelete(false); }}
        isDeleting={isDeletingMessage}
        title={t("LeaveRequests.student.Delete", "Delete")}
        name={isBulkDelete ? `${selectedMessageIds.length} ${t("LeaveRequests.student.messagesCount", "message(s)")}` : t("LeaveRequests.student.singleMessage", "message")}
        confirmText={t("LeaveRequests.student.yesDelete", "Yes, Delete")}
        actionType="delete"
      />
    </Modal>
  );
}
