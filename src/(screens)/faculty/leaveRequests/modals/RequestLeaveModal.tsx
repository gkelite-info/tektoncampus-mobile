import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, CaretDown } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { submitFacultyLeaveRequest, fetchAllFaculties } from '@/lib/helpers/faculty/leaveRequests/facultyLeaveAPI';
import { Avatar } from '@/components/Avatar';

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyId: number;
  onSuccess: () => void;
}

export default function RequestLeaveModal({ isOpen, onClose, facultyId, onSuccess }: RequestLeaveModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [taggedFacultyIds, setTaggedFacultyIds] = useState<number[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const leaveTypes = ['Sick', 'Personal', 'Emergency', 'Travel', 'Function'];

  React.useEffect(() => {
    if (isOpen && facultyId) {
      fetchAllFaculties(facultyId).then(setFaculties);
    }
  }, [isOpen, facultyId]);

  const toggleTag = (id: number) => {
    if (taggedFacultyIds.includes(id)) {
      setTaggedFacultyIds(prev => prev.filter(fId => fId !== id));
    } else {
      setTaggedFacultyIds(prev => [...prev, id]);
    }
  };

  const handleSubmit = async () => {
    if (!leaveType) {
      Toast.show({ type: 'error', text1: 'Please select a leave type' });
      return;
    }
    if (!startDate || !endDate) {
      Toast.show({ type: 'error', text1: 'Please select start and end dates (YYYY-MM-DD)' });
      return;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Please provide a description' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFacultyLeaveRequest(facultyId, {
        leaveType,
        startDate,
        endDate,
        description,
        taggedFacultyIds,
      });
      Toast.show({ type: 'success', text1: 'Leave request submitted successfully!' });
      setTaggedFacultyIds([]);
      onSuccess();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1 justify-center items-center bg-black/40 px-4"
      >
        <View className="bg-white w-full rounded-2xl shadow-xl overflow-hidden max-w-sm">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
            <Text className="text-lg font-bold text-[#282828]">Request Leave</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting} className="p-1">
              <X size={20} color="#9CA3AF" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" contentContainerStyle={{ gap: 16 }}>
            {}
            <View className="gap-1.5 z-50">
              <Text className="text-sm font-semibold text-[#282828]">Leave Type *</Text>
              <TouchableOpacity 
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 flex-row justify-between items-center"
              >
                <Text className={`text-sm ${leaveType ? 'text-[#282828]' : 'text-gray-400'}`}>
                  {leaveType || 'Select Leave Type'}
                </Text>
                <CaretDown size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-sm z-50 overflow-hidden">
                  {leaveTypes.map((type, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      onPress={() => { setLeaveType(type); setShowTypeDropdown(false); }}
                      className="px-4 py-3 border-b border-gray-100 bg-white"
                    >
                      <Text className="text-sm text-[#282828]">{type} Leave</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {}
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1.5">
                <Text className="text-sm font-semibold text-[#282828]">Start Date *</Text>
                <TextInput 
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828]"
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Text className="text-sm font-semibold text-[#282828]">End Date *</Text>
                <TextInput 
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828]"
                />
              </View>
            </View>
            {}
            <View className="gap-1.5 z-10">
              <Text className="text-sm font-semibold text-[#282828]">Description *</Text>
              <TextInput 
                value={description}
                onChangeText={setDescription}
                placeholder="Provide a short explanation..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828] min-h-[80px]"
              />
            </View>

            {}
            <View className="gap-1.5 z-0">
              <Text className="text-sm font-semibold text-[#282828]">Tag Faculty (Optional)</Text>
              <TouchableOpacity 
                onPress={() => setShowTagDropdown(!showTagDropdown)}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 flex-row justify-between items-center"
              >
                <Text className={`text-sm ${taggedFacultyIds.length > 0 ? 'text-[#43C17A] font-semibold' : 'text-gray-400'}`}>
                  {taggedFacultyIds.length > 0 ? `${taggedFacultyIds.length} Faculty Tagged` : 'Select Faculties'}
                </Text>
                <CaretDown size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showTagDropdown && (
                <View className="border border-gray-200 rounded-lg shadow-sm mt-1 max-h-40 overflow-hidden bg-gray-50">
                  <ScrollView nestedScrollEnabled className="w-full">
                    {faculties.map((fac) => {
                      const isSelected = taggedFacultyIds.includes(fac.id);
                      return (
                        <TouchableOpacity 
                          key={fac.id} 
                          onPress={() => toggleTag(fac.id)}
                          className={`flex-row items-center px-3 py-2 border-b border-gray-100 ${isSelected ? 'bg-[#E7F8EE]' : 'bg-white'}`}
                        >
                          <Avatar src={fac.photo} size={24} />
                          <Text className={`text-sm ml-3 flex-1 ${isSelected ? 'text-[#43C17A] font-bold' : 'text-[#282828]'}`}>
                            {fac.name}
                          </Text>
                          {isSelected && (
                            <View className="w-4 h-4 bg-[#43C17A] rounded-full items-center justify-center">
                              <Text className="text-white text-[10px] font-bold">✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                    {faculties.length === 0 && (
                      <View className="px-3 py-4 items-center">
                        <Text className="text-xs text-gray-400">No faculties available to tag</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="p-4 border-t border-gray-100 flex-row gap-3">
            <TouchableOpacity 
              onPress={onClose} 
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 rounded-lg items-center justify-center"
            >
              <Text className="text-[#525252] font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#43C17A] rounded-lg items-center justify-center"
            >
              <Text className="text-white font-bold text-sm">{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
