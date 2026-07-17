import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, CaretDown } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { submitFacultyLeaveRequest, fetchAllFaculties } from '@/lib/helpers/faculty/leaveRequests/facultyLeaveAPI';
import { Avatar } from '@/components/Avatar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useUser } from '@/utils/context/UserContext';
import { useFaculty } from '@/utils/context/faculty/useFaculty';
interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyId: number;
  onSuccess: () => void;
}
export default function RequestLeaveModal({
  isOpen,
  onClose,
  facultyId,
  onSuccess
}: RequestLeaveModalProps) {
  const {
    t
  } = useTranslation();
  const { collegeId } = useUser();
  const { collegeEducationId } = useFaculty();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [taggedFacultyIds, setTaggedFacultyIds] = useState<number[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const leaveTypes = ['Sick', 'Personal', 'Emergency', 'Travel', 'Function'];
  React.useEffect(() => {
    if (isOpen && facultyId && collegeId && collegeEducationId) {
      fetchAllFaculties(facultyId, collegeId, collegeEducationId).then(setFaculties);
    }
  }, [isOpen, facultyId, collegeId, collegeEducationId]);
  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toggleTag = (id: number) => {
    if (taggedFacultyIds.includes(id)) {
      setTaggedFacultyIds(prev => prev.filter(fId => fId !== id));
    } else {
      setTaggedFacultyIds(prev => [...prev, id]);
    }
  };
  const handleSubmit = async () => {
    if (!leaveType) {
      Toast.show({
        type: 'error',
        text1: 'Please select a leave type'
      });
      return;
    }
    if (!startDate || !endDate) {
      Toast.show({
        type: 'error',
        text1: 'Please select start and end dates (YYYY-MM-DD)'
      });
      return;
    }
    if (!description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please provide a description'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitFacultyLeaveRequest(facultyId, {
        leaveType,
        startDate,
        endDate,
        description,
        taggedFacultyIds
      });
      Toast.show({
        type: 'success',
        text1: 'Leave request submitted successfully!'
      });
      setTaggedFacultyIds([]);
      onSuccess();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to submit request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-center items-center bg-black/40 px-4">
        
        <View className="bg-white w-full rounded-2xl shadow-xl overflow-hidden max-w-sm">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
            <Text style={[{ fontFamily: fonts.bold }]} className="text-lg text-[#282828]">{t("Auto.Common.RequestLeave", "Request Leave")}</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting} className="p-1">
              <X size={20} color="#9CA3AF" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" contentContainerStyle={{
          gap: 16
        }}>
            {}
            <View className="gap-1.5 z-50">
              <Text style={[{ fontFamily: fonts.semiBold }]} className="text-sm text-[#282828]">{t("Auto.Common.LeaveType", "Leave Type *")}</Text>
              <TouchableOpacity onPress={() => setShowTypeDropdown(!showTypeDropdown)} className="w-full border border-gray-200 rounded-lg px-3 py-3 flex-row justify-between items-center">
                
                <Text style={[{ fontFamily: fonts.regular }]} className={`text-sm ${leaveType ? 'text-[#282828]' : 'text-gray-400'}`}>
                  {leaveType || 'Select Leave Type'}
                </Text>
                <CaretDown size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showTypeDropdown && <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-sm z-50 overflow-hidden">
                  {leaveTypes.map((type, idx) => {
                
                return <TouchableOpacity key={idx} onPress={() => {
                  setLeaveType(type);
                  setShowTypeDropdown(false);
                }} className="px-4 py-3 border-b border-gray-100 bg-white">
                  
                      <Text style={[{ fontFamily: fonts.regular }]} className="text-sm text-[#282828]">{type}{t("Auto.Common.Leave", "Leave")}</Text>
                    </TouchableOpacity>;
              })}
                </View>}
            </View>

            {}
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1.5">
                <Text style={[{ fontFamily: fonts.semiBold }]} className="text-sm text-[#282828]">{t("Auto.Common.StartDate", "Start Date *")}</Text>
                <TouchableOpacity onPress={() => setStartDatePickerVisibility(true)} className="border border-gray-200 rounded-lg px-3 py-3 text-sm flex-row justify-between items-center h-[46px]">
                  <Text style={[{ fontFamily: fonts.regular }]} className={startDate ? 'text-[#282828]' : 'text-gray-400'}>
                    {startDate || t("Auto.Attr.YYYYMMDD", "YYYY-MM-DD")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-1 gap-1.5">
                <Text style={[{ fontFamily: fonts.semiBold }]} className="text-sm text-[#282828]">{t("Auto.Common.EndDate", "End Date *")}</Text>
                <TouchableOpacity onPress={() => setEndDatePickerVisibility(true)} className="border border-gray-200 rounded-lg px-3 py-3 text-sm flex-row justify-between items-center h-[46px]">
                  <Text style={[{ fontFamily: fonts.regular }]} className={endDate ? 'text-[#282828]' : 'text-gray-400'}>
                    {endDate || t("Auto.Attr.YYYYMMDD", "YYYY-MM-DD")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {}
            <View className="gap-1.5 z-10">
              <Text style={[{ fontFamily: fonts.semiBold }]} className="text-sm text-[#282828]">{t("Auto.Common.Description", "Description *")}</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder={t("Auto.Attr.Provideashortex", "Provide a short explanation...")} placeholderTextColor="#9CA3AF" multiline numberOfLines={4} textAlignVertical="top" className="border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828] min-h-[80px]" />
              
            </View>

            {}
            <View className="gap-1.5 z-0">
              <Text style={[{ fontFamily: fonts.semiBold }]} className="text-sm text-[#282828]">{t("Auto.Common.TagFacultyOptio", "Tag Faculty (Optional)")}</Text>
              <TouchableOpacity onPress={() => setShowTagDropdown(!showTagDropdown)} className="w-full border border-gray-200 rounded-lg px-3 py-3 flex-row justify-between items-center">
                
                <Text style={[{ fontFamily: fonts.regular }]} className={`text-sm ${taggedFacultyIds.length> 0 ? 'text-[#43C17A] font-semibold' : 'text-gray-400'}`}>
                  {taggedFacultyIds.length > 0 ? `${taggedFacultyIds.length} Faculty Tagged` : 'Select Faculties'}
                </Text>
                <CaretDown size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showTagDropdown && <View className="border border-gray-200 rounded-lg shadow-sm mt-1 max-h-40 overflow-hidden bg-gray-50">
                  <ScrollView nestedScrollEnabled className="w-full">
                    {faculties.map(fac => {
                  const isSelected = taggedFacultyIds.includes(fac.id);
                  return <TouchableOpacity key={fac.id} onPress={() => toggleTag(fac.id)} className={`flex-row items-center px-3 py-2 border-b border-gray-100 ${isSelected ? 'bg-[#E7F8EE]' : 'bg-white'}`}>
                        
                          <Avatar src={fac.photo} size={24} />
                          <Text style={[{ fontFamily: fonts.bold }]} className={`text-sm ml-3 flex-1 ${isSelected ? 'text-[#43C17A] ' : 'text-[#282828]'}`}>
                            {fac.name}
                          </Text>
                          {isSelected && <View className="w-4 h-4 bg-[#43C17A] rounded-full items-center justify-center">
                              <Text style={[{ fontFamily: fonts.bold }]} className="text-white text-[10px] ">✓</Text>
                            </View>}
                        </TouchableOpacity>;
                })}
                    {faculties.length === 0 && <View className="px-3 py-4 items-center">
                        <Text style={[{ fontFamily: fonts.regular }]} className="text-xs text-gray-400">{t("Auto.Common.Nofacultiesavai", "No faculties available to tag")}</Text>
                      </View>}
                  </ScrollView>
                </View>}
            </View>
          </ScrollView>

          <View className="p-4 border-t border-gray-100 flex-row gap-3">
            <TouchableOpacity onPress={onClose} disabled={isSubmitting} className="flex-1 py-3 bg-gray-100 rounded-lg items-center justify-center">
              
              <Text style={[{ fontFamily: fonts.bold }]} className="text-[#525252] text-sm">{t("Auto.Common.Cancel", "Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-[#43C17A] rounded-lg items-center justify-center">
              
              <Text style={[{ fontFamily: fonts.bold }]} className="text-white text-sm">{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        date={startDate ? new Date(startDate) : new Date()}
        onConfirm={(date) => {
          setStartDate(formatDateString(date));
          setStartDatePickerVisibility(false);
        }}
        onCancel={() => setStartDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        date={endDate ? new Date(endDate) : new Date()}
        onConfirm={(date) => {
          setEndDate(formatDateString(date));
          setEndDatePickerVisibility(false);
        }}
        onCancel={() => setEndDatePickerVisibility(false)}
      />
    </Modal>;
}
