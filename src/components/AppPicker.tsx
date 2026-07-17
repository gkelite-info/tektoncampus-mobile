import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CaretDown } from 'phosphor-react-native';
import { Text } from '@/components/AppText';

interface AppPickerProps {
  selectedValue: any;
  onValueChange: (value: any, itemIndex?: number) => void;
  items: { label: string; value: any }[];
  placeholder?: string;
  disabled?: boolean;
}

export function AppPicker({ selectedValue, onValueChange, items, placeholder, disabled }: AppPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Consider string conversion for matching if necessary, but strict equal is usually fine
  const selectedItem = items.find(item => item.value === selectedValue);
  const displayLabel = selectedItem ? selectedItem.label : (placeholder || 'Select...');

  if (Platform.OS === 'android') {
    return (
      <View className={`border border-gray-300 rounded-lg bg-gray-50 overflow-hidden ${disabled ? 'opacity-50' : ''}`}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          enabled={!disabled}
          dropdownIconColor="#4b5563"
        >
          {placeholder && <Picker.Item label={placeholder} value={undefined} color="#6b7280" />}
          {items.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    );
  }

  // iOS
  return (
    <>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        className={`border border-gray-300 rounded-lg px-4 py-3.5 bg-gray-50 flex-row justify-between items-center ${disabled ? 'opacity-50' : ''}`}
      >
        <View className="flex-1 mr-2">
           <Text className={selectedItem ? "text-gray-800" : "text-gray-500"} numberOfLines={1}>
             {displayLabel}
           </Text>
        </View>
        <CaretDown size={16} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="px-2 py-1">
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedValue}
              onValueChange={onValueChange}
            >
              {placeholder && <Picker.Item label={placeholder} value={undefined} color="#6b7280" />}
              {items.map((item, index) => (
                <Picker.Item key={index} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#d1d5db', // iOS standard picker background slightly gray
    paddingBottom: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#c5c5c5',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  doneText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  }
});
