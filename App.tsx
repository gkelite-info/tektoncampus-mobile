import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { LogBox } from 'react-native';
import './global.css';

import Toast from "react-native-toast-message";

import RootNavigator from '@/navigation/RootNavigator';
import { UserProvider } from '@/utils/context/UserContext';
import { ParentProvider } from '@/providers/ParentProvider';
import QueryProvider from '@/providers/QueryProvider';

import './i18n';

// Suppress specific development warnings from console/terminal and screen
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args.join(" ");
  if (
    message.includes("[Reanimated] Reduced motion setting is enabled on this device") ||
    message.includes("SafeAreaView has been deprecated") ||
    message.includes("setLayoutAnimationEnabledExperimental is currently a no-op")
  ) {
    return;
  }
  originalWarn(...args);
};

LogBox.ignoreLogs([
  '[Reanimated] Reduced motion setting is enabled on this device.',
  'SafeAreaView has been deprecated and will be removed in a future release.',
  'setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.',
]);
LogBox.ignoreAllLogs(true);

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
          <ParentProvider>
            <RootNavigator />
          </ParentProvider>
        </UserProvider>
        <Toast position='top' swipeable />
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      </SafeAreaProvider>
    </QueryProvider>
    // </NextIntlClientProvider >
  );
}
