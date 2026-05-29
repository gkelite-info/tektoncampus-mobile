import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Text, TextInput } from 'react-native';
import { NextIntlClientProvider } from 'next-intl';
import './global.css';
import Toast from "react-native-toast-message";
import RootNavigator from '@/navigation/RootNavigator';
import { UserProvider } from '@/utils/context/UserContext';
import en from '@/locales/en.json';

const messages = {
  Dashboard: {
    student: {
      "Attendance": "Attendance",
      "Assignments": "Assignments",
      "Mid Exams": "Mid Exams",
      "N/A": "N/A",
      "Fee Due": "Fee Due",
      "Upcoming Events": "Upcoming Events",
      "No events scheduled": "No events scheduled",
      "Cancelled": "Cancelled",
      "Join": "Join",
      "Prof {name}": "Prof {name}",
      "Faculty not assigned": "Faculty not assigned",
      "{count} Due": "{count} Due",
      "Student Id - ": "Student Id - ",
      "Welcome Back, ": "Welcome Back, ",
      "Youâ€™ve completed ": "Youâ€™ve completed ",
      " of your tasks": " of your tasks",
      "Keep up the great progress!": "Keep up the great progress!",
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'Jost-Regular': require('./assets/fonts/Jost-Regular.ttf'),
    'Jost-Medium': require('./assets/fonts/Jost-Medium.ttf'),
    'Jost-SemiBold': require('./assets/fonts/Jost-SemiBold.ttf'),
    'Jost-Bold': require('./assets/fonts/Jost-Bold.ttf'),
    'Jost-Italic': require('./assets/fonts/Jost-Italic-VariableFont_wght.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <NextIntlClientProvider locale="en" messages={en}>
      <SafeAreaProvider className="bg-white">
        <UserProvider>
          <RootNavigator />
        </UserProvider>
        <Toast position='top' swipeable />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </NextIntlClientProvider>
  );
}
