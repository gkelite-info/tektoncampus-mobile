import React from 'react';
import { View, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import WellbeingContent from './components/WellbeingContent';

export default function WellbeingScreen(props: any) {
  const headerHeight = useHeaderHeight();

  // Determine role based on navigation context or user context
  // Here we use a generic prop or route param if available, fallback to student
  const role = props.route?.params?.role || 'student'; 

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, paddingTop: headerHeight + 10 }}
      >
        <WellbeingContent role={role} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
