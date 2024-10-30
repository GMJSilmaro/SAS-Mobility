import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useCallback } from 'react';
import { FONTS } from './constants/fonts';
import AppNavigation from './navigations/AppNavigation';
import { LogBox } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { JobDataProvider } from './contexts/JobDataContext';

//Ignore all log notifications
LogBox.ignoreAllLogs();

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded] = useFonts(FONTS)

  const onLayoutRootView = useCallback(async () => {
      if (fontsLoaded) {
          await SplashScreen.hideAsync()
      }
  }, [fontsLoaded])

  if (!fontsLoaded) {
      return null
  }

  return (
      <JobDataProvider>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <AppNavigation />
          <FlashMessage position="bottom" />
        </SafeAreaProvider>
      </JobDataProvider>
  );
}