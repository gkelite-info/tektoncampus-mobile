import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import './global.css'
import LoginScreen from '@/(screens)/(auth)/loginScreen';

export default function App() {

  return (
    <SafeAreaProvider className='bg-white text-white font-bold'>
      <LoginScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
