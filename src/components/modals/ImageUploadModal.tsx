import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { X, Camera, Image as ImageIcon } from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabaseClient";

type ImageUploadModalProps = {
    visible: boolean;
    onClose: () => void;
    userId: number;
    onUploadSuccess: (publicUrl: string) => void;
};

export default function ImageUploadModal({ visible, onClose, userId, onUploadSuccess }: ImageUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: "error", text1: "Camera permission is required" });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for profile picture
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const handleGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: "error", text1: "Gallery permission is required" });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            setIsUploading(true);
            const ext = asset.uri.split('.').pop() || 'jpg';
            const fileName = `profile_${userId}_${Date.now()}.${ext}`;
            const filePath = `${userId}/${fileName}`;

            if (!asset.base64) {
                throw new Error("Base64 data missing");
            }

            const { decode } = require('base64-arraybuffer');

            const { data, error } = await supabase.storage
                .from('user_profiles')
                .upload(filePath, decode(asset.base64), {
                    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                    upsert: true,
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('user_profiles')
                .getPublicUrl(filePath);

            const now = new Date().toISOString();
            const { error: updateError } = await supabase
                .from('user_profile')
                .upsert(
                    { userId, profileUrl: publicUrl, updatedAt: now, createdAt: now, is_deleted: false },
                    { onConflict: "userId" }
                );

            if (updateError) throw updateError;

            Toast.show({ type: "success", text1: "Profile picture updated!" });
            onUploadSuccess(publicUrl);
            onClose();
        } catch (error: any) {
            console.error("Upload error:", error);
            Toast.show({ type: "error", text1: "Failed to upload image" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center px-4">
                <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
                    <TouchableOpacity onPress={onClose} className="absolute right-4 top-4 p-2 bg-gray-50 rounded-full z-10">
                        <X size={18} color="#6b7280" weight="bold" />
                    </TouchableOpacity>

                    <Text className="text-xl font-bold text-[#1B2B5B] mb-2 text-center">Update Photo</Text>
                    <Text className="text-sm text-gray-500 mb-6 text-center">Choose an option to set your profile picture</Text>

                    {isUploading ? (
                        <View className="py-8 items-center">
                            <ActivityIndicator size="large" color="#43C17A" />
                            <Text className="mt-4 font-medium text-gray-600">Uploading...</Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            <TouchableOpacity 
                                onPress={handleCamera}
                                className="w-full flex-row items-center p-4 rounded-xl border border-gray-200 bg-gray-50"
                            >
                                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                                    <Camera size={20} color="#2563eb" weight="fill" />
                                </View>
                                <View>
                                    <Text className="text-[#282828] font-bold text-base">Take a Photo</Text>
                                    <Text className="text-gray-500 text-xs">Use your camera</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={handleGallery}
                                className="w-full flex-row items-center p-4 rounded-xl border border-gray-200 bg-gray-50"
                            >
                                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-4">
                                    <ImageIcon size={20} color="#16a34a" weight="fill" />
                                </View>
                                <View>
                                    <Text className="text-[#282828] font-bold text-base">Choose from Gallery</Text>
                                    <Text className="text-gray-500 text-xs">Browse your photos</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
