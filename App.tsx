import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { LogBox } from 'react-native';
import './global.css';

import Toast from "react-native-toast-message";

import RootNavigator from '@/navigation/RootNavigator';
import { UserProvider } from '@/utils/context/UserContext';
import QueryProvider from '@/providers/QueryProvider';

import './i18n';

LogBox.ignoreLogs([
  '[Reanimated] Reduced motion setting is enabled on this device.',
]);

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
    // <NextIntlClientProvider locale="en" messages={en}>
    <QueryProvider>
      <SafeAreaProvider className="bg-white">
        <UserProvider>
          <RootNavigator />
        </UserProvider>
        <Toast position='top' swipeable />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryProvider>
    // </NextIntlClientProvider >
  );
}
