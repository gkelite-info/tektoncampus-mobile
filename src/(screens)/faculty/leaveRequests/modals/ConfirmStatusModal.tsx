import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { updateStudentLeaveStatus } from '@/lib/helpers/faculty/leaveRequests/facultyLeaveAPI';

interface ConfirmStatusModalProps {
  isOpen: boolean;
  action: "Approved" | "Rejected";
  leaveId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmStatusModal({ isOpen, action, leaveId, onClose, onSuccess }: ConfirmStatusModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isApprove = action === "Approved";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await updateStudentLeaveStatus(leaveId, action);
      Toast.show({ type: 'success', text1: `Leave ${action} successfully!` });
      onSuccess();
    } catch (error) {
      Toast.show({ type: 'error', text1: `Failed to ${action.toLowerCase()} leave` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex-col gap-3">
          <Text className="text-lg font-bold text-gray-800">
            Confirm {isApprove ? "Approval" : "Rejection"}
          </Text>
          <Text className="text-sm text-gray-600 mt-1 leading-relaxed">
            Are you sure you want to {isApprove ? "approve" : "reject"} this leave request?
          </Text>
          
          <View className="flex-row gap-3 justify-end mt-4">
            <TouchableOpacity 
              onPress={onClose} 
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg border border-gray-200 justify-center"
            >
              <Text className="text-sm font-medium text-gray-600">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleConfirm} 
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-lg justify-center ${isApprove ? 'bg-[#43C17A]' : 'bg-[#FF4B4B]'}`}
            >
              <Text className="text-white text-sm font-medium">
                {isSubmitting ? 'Wait...' : `Yes, ${action}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
