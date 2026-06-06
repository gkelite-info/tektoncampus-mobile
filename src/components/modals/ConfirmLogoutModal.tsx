import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { WarningCircle } from "phosphor-react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
};

export default function ConfirmLogoutModal({ visible, onClose, onConfirm }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        await onConfirm();
        setIsLoading(false);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 items-center justify-center p-4">
                <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center">
                    <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                        <WarningCircle size={32} color="#ef4444" weight="fill" />
                    </View>
                    
                    <Text className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</Text>
                    <Text className="text-center text-gray-500 mb-6">
                        Are you sure you want to log out? You will need to enter your credentials again to access your account.
                    </Text>

                    <View className="flex-row gap-3 w-full">
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                        >
                            <Text className="font-semibold text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleConfirm}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-red-500 rounded-xl items-center flex-row justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text className="font-semibold text-white">Logging out...</Text>
                                </>
                            ) : (
                                <Text className="font-semibold text-white">Logout</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
