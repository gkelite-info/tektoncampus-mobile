import React from 'react';
import { Modal, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
    visible: boolean;
    onClose: () => void;
    initialView?: {
        tab?: "all" | "inbox" | "sent";
        compose?: boolean;
    };
};

export default function EmailModal({ visible, onClose, initialView }: Props) {
    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "fullScreen"} 
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-[#F4F4F4]">
                <View className="p-4 border-b border-gray-200 flex-row justify-between items-center bg-white">
                    <Text className="text-lg font-bold text-[#282828]">Email {initialView?.compose ? '(Compose)' : ''}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-[#43C17A] font-medium">Close</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Email Modal Content</Text>
                    {initialView?.tab && <Text className="text-gray-400 mt-2">Tab: {initialView.tab}</Text>}
                </View>
            </SafeAreaView>
        </Modal>
    );
}
