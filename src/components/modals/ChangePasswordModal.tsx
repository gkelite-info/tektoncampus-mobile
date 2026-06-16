import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import { ArrowLeft, Eye, EyeSlash, Lock } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";
import { verifyCurrentPassword, updateUserPassword } from "@/lib/helpers/settings/passwordAPI";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function ChangePasswordModal({ visible, onClose }: Props) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { email } = useUser();

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: "error", text1: "Error", text2: "All fields are required" });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: "error", text1: "Error", text2: "New passwords do not match" });
            return;
        }

        if (newPassword.length < 6) {
            Toast.show({ type: "error", text1: "Error", text2: "Password must be at least 6 characters" });
            return;
        }

        if (!email) {
            Toast.show({ type: "error", text1: "Error", text2: "User email not found." });
            return;
        }

        setIsLoading(true);
        try {
            
            await verifyCurrentPassword(email, currentPassword);
            
            
            await updateUserPassword(newPassword);

            Toast.show({ type: "success", text1: "Success", text2: "Password updated successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onClose();
        } catch (error: any) {
            Toast.show({ 
                type: "error", 
                text1: "Error", 
                text2: error?.message || "Failed to update password. Ensure current password is correct." 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row items-center border-b border-gray-100 p-4">
                    <TouchableOpacity onPress={onClose} className="mr-3 p-1">
                        <ArrowLeft size={24} color="#282828" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-[#282828]">Change Password</Text>
                </View>

                <View className="flex-1 p-5">
                    <View className="items-center mb-8">
                        <View className="bg-[#43C17A1F] p-4 rounded-full mb-4">
                            <Lock size={40} color="#43C17A" weight="duotone" />
                        </View>
                        <Text className="text-base text-center text-[#525252]">
                            Create a new password that is at least 6 characters long.
                        </Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-xs font-bold text-[#515151] mb-2">Current Password</Text>
                        <View className="flex-row items-center border border-[#CCCCCC] rounded-md px-3 bg-white">
                            <TextInput
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrent}
                                placeholder="Enter current password"
                                className="flex-1 py-3 text-[#525252]"
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} className="p-2">
                                {showCurrent ? <Eye size={20} color="#888" /> : <EyeSlash size={20} color="#888" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-xs font-bold text-[#515151] mb-2">New Password</Text>
                        <View className="flex-row items-center border border-[#CCCCCC] rounded-md px-3 bg-white">
                            <TextInput
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNew}
                                placeholder="Enter new password"
                                className="flex-1 py-3 text-[#525252]"
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} className="p-2">
                                {showNew ? <Eye size={20} color="#888" /> : <EyeSlash size={20} color="#888" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-xs font-bold text-[#515151] mb-2">Confirm New Password</Text>
                        <View className="flex-row items-center border border-[#CCCCCC] rounded-md px-3 bg-white">
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                                placeholder="Confirm new password"
                                className="flex-1 py-3 text-[#525252]"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-2">
                                {showConfirm ? <Eye size={20} color="#888" /> : <EyeSlash size={20} color="#888" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isLoading}
                        className="bg-[#43C17A] py-3.5 rounded-xl flex-row justify-center items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text className="font-bold text-white text-base">Updating...</Text>
                            </>
                        ) : (
                            <Text className="font-bold text-white text-base">Update Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
