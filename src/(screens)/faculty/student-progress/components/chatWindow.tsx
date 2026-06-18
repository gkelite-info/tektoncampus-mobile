import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, Modal, TouchableOpacity, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CaretLeft, Smiley, PaperPlaneRight, ChatCircleDots } from "phosphor-react-native";
import tw from "twrnc";
import { Parent } from "./parentsList";
interface ChatWindowProps {
  parent: Parent;
  onClose: () => void;
  visible: boolean;
}
export default function ChatWindow({
  parent,
  onClose,
  visible
}: ChatWindowProps) {
  const {
    t
  } = useTranslation();
  const messages = [{
    text: "Good morning Sir , I wanted to ask about her attendance.",
    isSender: false
  }, {
    text: "Good morning. I'll share her attendance details.",
    isSender: true
  }, {
    text: "Is she doing well in class?",
    isSender: false
  }, {
    text: "He has missed 3 classes last week.",
    isSender: true
  }, {
    text: "We received a notice about low attendance.",
    isSender: false
  }, {
    text: "Don't worry, she is doing fine overall.",
    isSender: true
  }, {
    text: "Could you please update me on her recent performance?",
    isSender: false
  }, {
    text: "Sure, I'll share her performance details.",
    isSender: true
  }];
  return <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={tw`flex-1 bg-black/50 justify-end`}>
        <View style={tw`bg-white rounded-t-3xl h-[85%] p-4 md:p-6 shadow-sm flex-col`}>
          <TouchableOpacity style={tw`flex-row items-center gap-2 md:gap-3 mb-4 md:mb-6`} onPress={onClose}>
            
            <CaretLeft size={28} color="#333" weight="bold" />
            <Text style={tw`text-lg md:text-2xl font-bold text-[#333]`}>{t("Auto.Common.ParentsChat", "Parent's Chat")}</Text>
          </TouchableOpacity>

          <View style={tw`bg-[#E8F6E2] rounded-2xl p-3 md:p-4 flex-row items-center justify-between mb-4 md:mb-8 shadow-sm`}>
            <View style={tw`flex-row items-center gap-3 md:gap-4 flex-1 pr-2`}>
              <Image source={parent.avatar ? {
              uri: parent.avatar
            } : require("../../../../../assets/maleuser.png")} defaultSource={require("../../../../../assets/maleuser.png")} style={tw`w-12 h-12 rounded-full border-2 border-white`} />
              
              <View style={tw`flex-1`}>
                <Text style={tw`text-[15px] md:text-lg font-bold text-[#1a1a1a]`} numberOfLines={1}>
                  {parent.name}
                </Text>
                <Text style={tw`text-xs md:text-sm font-medium text-[#555]`} numberOfLines={1}>
                  {parent.relation}
                </Text>
              </View>
            </View>
            <View style={tw`w-10 h-10 md:w-12 md:h-12 bg-[#95D078] rounded-full flex items-center justify-center`}>
              <ChatCircleDots size={24} color="white" weight="fill" />
            </View>
          </View>

          <ScrollView style={tw`flex-1 mb-4`} showsVerticalScrollIndicator={false}>
            {messages.map((msg, idx) => {
            
            return <View key={idx} style={tw`flex-row w-full mb-4 ${msg.isSender ? "justify-end" : "justify-start"}`}>
              
                <View style={tw`max-w-[80%] p-3 md:p-4 rounded-xl shadow-sm ${msg.isSender ? "bg-[#95D078] rounded-br-sm" : "bg-[#EFF8E9] rounded-bl-sm"}`}>
                
                  <Text style={tw`text-[13px] md:text-[15px] font-medium leading-5 ${msg.isSender ? "text-white" : "text-[#2d3a2f]"}`}>
                    {msg.text}
                  </Text>
                  <Text style={tw`text-[10px] md:text-[11px] mt-1.5 text-right ${msg.isSender ? "text-white/80" : "text-[#888]"}`}>{t("Auto.Common.1248PM", "12:48 PM")}


                </Text>
                </View>
              </View>;
          })}
          </ScrollView>

          <View style={tw`bg-[#E4F6E6] rounded-full px-2 py-2 flex-row items-center gap-2 mb-4`}>
            <TouchableOpacity style={tw`p-2`}>
              <Smiley size={24} color="#555" />
            </TouchableOpacity>
            <TextInput placeholder={t("Auto.Attr.Typeamessage", "Type a message...")} placeholderTextColor="#888" style={tw`flex-1 text-[13px] md:text-[15px] text-[#333] font-medium py-2`} />
            
            <TouchableOpacity style={tw`w-10 h-10 bg-[#2ECC71] rounded-full items-center justify-center shadow-md`}>
              <PaperPlaneRight size={20} color="white" weight="fill" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>;
}