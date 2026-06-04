import React, { useState, useEffect } from 'react';
import { 
    Modal, View, Text, TouchableOpacity, TextInput, 
    ScrollView, ActivityIndicator, Image, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Image as ImageIcon } from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '@/utils/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { saveCampusBuzzPost } from '@/lib/helpers/campusBuzz/campusBuzzAPI';
import { useTranslation } from 'react-i18next';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editData?: any;
};

export default function AddPostModal({ visible, onClose, onSuccess, editData }: Props) {
    const { t } = useTranslation("CampusBuzz");
    const { collegeId, userId } = useUser();
    
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<"achievements" | "announcements" | "clubactivities">("announcements");
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (visible) {
            if (editData) {
                setTitle(editData.title || '');
                setCategory(editData.category || 'announcements');
                setDescription(editData.description || '');
                setTags(Array.isArray(editData.tags) ? editData.tags : 
                       (typeof editData.tags === 'string' ? editData.tags.split(',').map((t: string) => t.trim()) : []));
                setImageUri(editData.imageUrl || null);
            } else {
                setTitle('');
                setCategory('announcements');
                setDescription('');
                setTags([]);
                setTagInput('');
                setImageUri(null);
            }
            setErrorMsg('');
        }
    }, [visible, editData]);

    const handleTagInput = (text: string) => {
        if (text.endsWith(' ') || text.endsWith(',')) {
            let val = text.trim().replace(/,/g, '');
            if (val === '') return;
            if (!val.startsWith('#')) val = '#' + val;
            
            if (!tags.includes(val)) {
                setTags([...tags, val]);
            }
            setTagInput('');
        } else {
            setTagInput(text);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const uploadImageToSupabase = async (uri: string) => {
        if (uri.startsWith('http')) return uri; // Already a remote URL (editing mode)

        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${collegeId}/campus-buzz/${fileName}`;

        // Convert URI to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
            .from("buzz_images")
            .upload(filePath, blob);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from("buzz_images")
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async () => {
        setErrorMsg('');
        if (!title.trim() || !description.trim()) {
            setErrorMsg(t("Title and Description are required", "Title and Description are required"));
            return;
        }

        if (!collegeId || !userId) {
            setErrorMsg(t("User session missing. Please log in again.", "User session missing. Please log in again."));
            return;
        }

        setIsSubmitting(true);

        try {
            let finalImageUrl = undefined;

            if (imageUri) {
                finalImageUrl = await uploadImageToSupabase(imageUri);
            }

            const payload = {
                campusBuzzPostId: editData?.campusBuzzPostId,
                collegeId: collegeId,
                title,
                category,
                description,
                tags: tags.length > 0 ? tags : undefined,
                imageUrl: finalImageUrl,
            };

            const result = await saveCampusBuzzPost(payload, userId);

            if (!result.success) throw result.error;

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to post:", error);
            setErrorMsg(error.message || t("Failed to create post. Please try again.", "Failed to create post. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle="pageSheet"
            onRequestClose={!isSubmitting ? onClose : undefined}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                    className="flex-1"
                >
                    <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
                        <Text className="font-semibold text-lg text-[#282828]">
                            {editData ? t("Edit Post", "Edit Post") : t("Create a New Post", "Create a New Post")}
                        </Text>
                        <TouchableOpacity 
                            onPress={onClose}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-full bg-gray-50"
                        >
                            <X size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 bg-gray-50/50 p-4" keyboardShouldPersistTaps="handled">
                        {errorMsg ? (
                            <Text className="text-red-500 mb-4 font-medium">{errorMsg}</Text>
                        ) : null}

                        <View className="mb-5">
                            <Text className="text-sm font-medium text-[#282828] mb-2">{t("Post Title *", "Post Title *")}</Text>
                            <TextInput 
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t("E.g. Faculty Workshop...", "E.g. Faculty Workshop...")}
                                placeholderTextColor="#9CA3AF"
                                className="w-full h-12 px-3 bg-white border border-gray-200 rounded-lg text-[#282828] text-base"
                            />
                        </View>

                        <View className="mb-5">
                            <Text className="text-sm font-medium text-[#282828] mb-2">{t("Category *", "Category *")}</Text>
                            <View className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                <Picker
                                    selectedValue={category}
                                    onValueChange={(itemValue) => setCategory(itemValue as any)}
                                    style={{ height: 50, width: '100%' }}
                                >
                                    <Picker.Item label={t("Announcements", "Announcements")} value="announcements" />
                                    <Picker.Item label={t("Achievements", "Achievements")} value="achievements" />
                                    <Picker.Item label={t("Clubs & Activities", "Clubs & Activities")} value="clubactivities" />
                                </Picker>
                            </View>
                        </View>

                        <View className="mb-5">
                            <Text className="text-sm font-medium text-[#282828] mb-2">{t("Description *", "Description *")}</Text>
                            <TextInput 
                                value={description}
                                onChangeText={setDescription}
                                placeholder={t("Provide details...", "Provide details...")}
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                className="w-full min-h-[100px] px-3 py-3 bg-white border border-gray-200 rounded-lg text-[#282828] text-base"
                            />
                        </View>

                        <View className="mb-5">
                            <Text className="text-sm font-medium text-[#282828] mb-2">{t("Tags", "Tags")}</Text>
                            <View className="flex-row flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <TouchableOpacity 
                                        key={tag}
                                        onPress={() => removeTag(tag)}
                                        className="bg-[#43C17A]/10 py-1.5 px-3 rounded-full flex-row items-center gap-1"
                                    >
                                        <Text className="text-[#43C17A] text-sm font-medium">{tag}</Text>
                                        <X size={12} color="#43C17A" weight="bold" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput 
                                value={tagInput}
                                onChangeText={handleTagInput}
                                placeholder={t("Add tags (space/comma to separate)", "Add tags (space/comma to separate)")}
                                placeholderTextColor="#9CA3AF"
                                className="w-full h-12 px-3 bg-white border border-gray-200 rounded-lg text-[#282828] text-base"
                            />
                        </View>

                        <View className="mb-8">
                            <Text className="text-sm font-medium text-[#282828] mb-2">{t("Image (Optional)", "Image (Optional)")}</Text>
                            {imageUri ? (
                                <View className="relative w-full h-[200px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                    <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="contain" />
                                    <TouchableOpacity 
                                        onPress={() => setImageUri(null)}
                                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm"
                                    >
                                        <X size={16} color="#EF4444" weight="bold" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    onPress={pickImage}
                                    className="w-full h-[120px] border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50"
                                >
                                    <ImageIcon size={32} color="#9CA3AF" />
                                    <Text className="text-gray-500 mt-2 font-medium">{t("Click to Upload Image", "Click to Upload Image")}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>

                    <View className="p-4 border-t border-gray-100 bg-white shadow-lg flex-row gap-3">
                        <TouchableOpacity 
                            onPress={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 border border-gray-200 rounded-xl items-center justify-center bg-white"
                        >
                            <Text className="text-[#282828] font-medium text-base">{t("Cancel", "Cancel")}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 rounded-xl items-center justify-center bg-[#43C17A] flex-row"
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-white font-semibold text-base">
                                    {editData ? t("Update Post", "Update Post") : t("Share Post", "Share Post")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}
