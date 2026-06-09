import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, FlatList, Image, Linking, ActivityIndicator, Keyboard } from 'react-native';
import { X, Paperclip, PaperPlaneRight, CalendarBlank, FilePdf, Checks } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabaseClient';
import { Avatar } from '@/components/Avatar';

import {
  fetchLeaveChatHistory,
  sendLeaveChatMessage,
  markMessagesAsRead,
} from '@/lib/helpers/faculty/leaveRequests/leaveChatAPI';

interface FacultyLeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveData: any;
  facultyId: number;
}

export default function FacultyLeaveDetailsModal({ isOpen, onClose, leaveData, facultyId }: FacultyLeaveDetailsModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && leaveData) {
      loadInitialHistory();
      setupRealtime();
      markMessagesAsRead(leaveData.id, "FACULTY");
    }
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [isOpen, leaveData]);

  const loadInitialHistory = async () => {
    setIsInitialLoading(true);
    try {
      const history = await fetchLeaveChatHistory(leaveData.id, 1, 50);
      setMessages(history);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load chat history' });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const reloadHistory = async () => {
    try {
      const history = await fetchLeaveChatHistory(leaveData.id, 1, 50);
      setMessages(history);
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
          if (payload.new.senderRole !== "FACULTY") {
             reloadHistory(); // simpler for mobile to just reload for now
          }
        }
      )
      .subscribe();
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

        const fileData = await fetch(fileObj.uri).then(r => r.blob());
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
        senderId: facultyId,
        senderRole: "FACULTY",
      });
      
      reloadHistory();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to send message', text2: err.message });
      setNewMessage(msgText);
      setSelectedFile(fileObj);
    } finally {
      setIsSending(false);
    }
  };

  const formatChatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderRole === "FACULTY";
    return (
      <View className={`flex-row gap-2 w-full mb-4 px-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && <Avatar src={item.senderAvatar} size={24} />}
        
        <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
          {!isMe && <Text className="text-[10px] font-bold text-[#43C17A] mb-1">{item.senderName}</Text>}
          
          <View className={`px-3 py-2 rounded-2xl ${isMe ? 'bg-[#43C17A] rounded-tr-sm' : 'bg-white rounded-tl-sm border border-gray-200'}`}>
            {item.mediaUrl && (
              <View className="mb-2">
                {item.mediaType === 'image' ? (
                  <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl)}>
                    <Image source={{ uri: item.mediaUrl }} style={{ width: 150, height: 150, borderRadius: 8 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl)} className={`flex-row items-center gap-1.5 px-2 py-1.5 rounded-md ${isMe ? 'bg-black/10' : 'bg-gray-100'}`}>
                    <FilePdf size={16} color={isMe ? "#FFF" : "#282828"} weight="fill" />
                    <Text className={`text-[11px] font-bold underline ${isMe ? 'text-white' : 'text-[#282828]'}`}>Document PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {item.message && (
              <Text className={`text-[13px] ${isMe ? 'text-white' : 'text-[#282828]'}`}>{item.message}</Text>
            )}
          </View>
          
          <View className="flex-row items-center gap-1 mt-1">
            <Text className="text-[9px] text-gray-400 font-medium">{formatChatTime(item.createdAt)}</Text>
            {isMe && <Checks size={12} color={item.isRead ? "#34B7F1" : "#D1D5DB"} weight="bold" />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black/40">
        <View className="bg-[#F5F7FA] mt-10 flex-1 rounded-t-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <View className="bg-white flex-row items-center justify-between p-4 border-b border-gray-100 shadow-sm z-10">
            <Text className="text-lg font-bold text-[#282828]">Leave Details</Text>
            <TouchableOpacity onPress={onClose} className="p-1 bg-gray-100 rounded-full">
              <X size={20} color="#525252" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Leave Info Context (Scrollable Header) */}
          <View className="bg-white border-b border-gray-200 p-4">
             <View className="flex-row items-center gap-3 mb-3">
               <Avatar src={leaveData?.photo} size={48} />
               <View className="flex-1">
                 <Text className="font-bold text-[#282828] text-base">{leaveData?.name}</Text>
                 <Text className="text-[#43C17A] font-bold text-xs">ID: #{leaveData?.rollNo}</Text>
               </View>
             </View>
             <View className="bg-[#10B9810F] border border-[#10B98120] rounded-xl p-3">
               <View className="flex-row justify-between mb-2">
                 <View>
                   <Text className="text-[10px] text-gray-500 font-medium">Leave Type</Text>
                   <Text className="text-xs font-bold text-blue-600">{leaveData?.leaveType}</Text>
                 </View>
                 <View className="items-end">
                   <Text className="text-[10px] text-gray-500 font-medium">Total Days</Text>
                   <Text className="text-xs font-bold text-[#43C17A]">{leaveData?.days} Days</Text>
                 </View>
               </View>
               <View className="flex-row items-center gap-1 mb-2">
                 <CalendarBlank size={12} color="#6B7280" />
                 <Text className="text-xs font-semibold text-[#282828]">{leaveData?.fromDate} - {leaveData?.toDate}</Text>
               </View>
               <Text className="text-xs text-gray-600 italic">"{leaveData?.description}"</Text>
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
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center pt-10">
                  <Text className="text-gray-400 italic text-sm">No communication yet.</Text>
                </View>
              }
            />
          )}

          {/* Chat Input */}
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
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 h-10 text-sm text-[#282828]"
                multiline
                maxLength={500}
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
    </Modal>
  );
}
