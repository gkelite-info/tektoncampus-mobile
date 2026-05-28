import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Text, TextInput } from 'react-native';
import './global.css';
import Toast from "react-native-toast-message";
import RootNavigator from '@/navigation/RootNavigator';

const setDefaultFont = () => {
  const defaultStyle = { fontFamily: 'Jost-Regular' };

  [Text, TextInput].forEach((Component) => {
    const componentWithDefaults = Component as typeof Component & {
      defaultProps?: { style?: unknown };
    };

    componentWithDefaults.defaultProps = componentWithDefaults.defaultProps ?? {};
    componentWithDefaults.defaultProps.style = [
      defaultStyle,
      componentWithDefaults.defaultProps.style,
    ];
  });
};

setDefaultFont();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Jost-Regular': require('./assets/fonts/Jost-Regular.ttf'),
    'Jost-Medium': require('./assets/fonts/Jost-Medium.ttf'),
    'Jost-SemiBold': require('./assets/fonts/Jost-SemiBold.ttf'),
    'Jost-Bold': require('./assets/fonts/Jost-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider className="bg-white">
      <RootNavigator />
      <Toast position='top' swipeable />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
