import React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function NewsModal({ visible, onClose }: Props) {
    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "fullScreen"} 
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-[#F4F4F4]">
                <View className="p-4 border-b border-gray-200 flex-row justify-between items-center bg-white">
                    <Text className="text-lg font-bold text-[#282828]">News</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-[#43C17A] font-medium">Close</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">News Modal Content</Text>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
