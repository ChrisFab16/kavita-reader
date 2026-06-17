import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

/** Leave reader immediately; persist progress in background (never block exit on save). */
export function exitReader(
  navigation: NativeStackNavigationProp<RootStackParamList, 'Reader'>,
  saveProgress?: () => void | Promise<void>
): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
  }
  if (saveProgress) {
    void Promise.resolve(saveProgress()).catch((err) => {
      console.warn('Background progress save on exit failed:', err);
    });
  }
}

/** Shared overlay chrome styles — must sit above full-screen page touch targets. */
export const READER_CHROME_Z_INDEX = 30;

export const readerChromeOverlay = {
  zIndex: READER_CHROME_Z_INDEX,
  elevation: READER_CHROME_Z_INDEX,
} as const;
