import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Modal, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Reply, ChevronDown } from 'lucide-react-native';
import RenderHtml from 'react-native-render-html';

export type EmailDetailItem = {
  id: number;
  isRead: boolean;
  initials: string;
  email: string;
  recipients?: string[];
  color: string;
  sender: string;
  subject: string;
  desc: string;
  time: string;
  date: string;
  body: string;
  Subject: string;
};

type Props = {
  visible: boolean;
  mail: EmailDetailItem | null;
  onClose: () => void;
  onReply: (mail: EmailDetailItem) => void;
};

export default function EmailDetailModal({ visible, mail, onClose, onReply }: Props) {const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [showRecipients, setShowRecipients] = useState(false);

  if (!mail) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"}
      transparent={Platform.OS === 'android'}
      onRequestClose={onClose}>
      
            <View style={{ flex: 1, backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent', paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
                <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                    <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-transparent">
              
                        <X size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
              onPress={() => onReply(mail)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
              
                        <Reply size={16} color="#43C17A" />
                        <Text className="text-[13px] font-medium text-[#43C17A]">{t("Auto.Common.Reply", "Reply")}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-5 pt-4">
                    <View className="flex-row items-start justify-between mb-6">
                        <View className="flex-row gap-3 flex-1">
                            <View
                  className="w-12 h-12 rounded-full items-center justify-center shadow-sm"
                  style={{ backgroundColor: mail.color }}>
                  
                                <Text className="text-[15px] text-[#414141] font-semibold">
                                    {mail.initials}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-[17px] font-semibold text-[#111827]">
                                    {mail.sender}
                                </Text>

                                {mail.recipients && mail.recipients.length > 1 ?
                  <View>
                                        <TouchableOpacity
                      onPress={() => setShowRecipients(!showRecipients)}
                      className="flex-row items-center gap-1 mt-0.5">
                      
                                            <Text className="text-[13px] text-[#43C17A] font-medium">
                                                {mail.email}
                                            </Text>
                                            <ChevronDown
                        size={14}
                        color="#43C17A"
                        style={{ transform: [{ rotate: showRecipients ? '180deg' : '0deg' }] }} />
                      
                                        </TouchableOpacity>

                                        {showRecipients &&
                    <View className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-2">
                                                {mail.recipients.map((rec, i) =>
                      <Text
                        key={i}
                        className="text-[12px] text-gray-700 py-1">
                        
                                                        {rec}
                                                    </Text>
                      )}
                                            </View>
                    }
                                    </View> :

                  <Text className="text-[14px] text-[#6B7280] mt-0.5">
                                        {mail.email}
                                    </Text>
                  }
                            </View>
                        </View>
                        <Text className="text-[12px] text-[#6B7280] ml-2">
                            {mail.time}, {mail.date}
                        </Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-[15px] text-[#111827] font-semibold mb-3">
                            {mail.Subject}
                        </Text>
                        
                        <RenderHtml
                contentWidth={width - 40}
                source={{ html: mail.body }}
                baseStyle={{ fontSize: 14, color: '#414141', lineHeight: 22 }}
                tagsStyles={{
                  a: { color: '#43C17A', textDecorationLine: 'underline' }
                }} />
              
                    </View>
                </ScrollView>
            </SafeAreaView>
            </View>
        </Modal>);

}