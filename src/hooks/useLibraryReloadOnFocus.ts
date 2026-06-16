import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLibraryDisplayStore } from '../stores/libraryDisplayStore';

/** Runs `onReset` when Settings (or elsewhere) bumps the library reset token. */
export function useLibraryReloadOnFocus(onReset: () => void) {
  const resetToken = useLibraryDisplayStore((state) => state.resetToken);
  const lastHandled = useRef(resetToken);

  useFocusEffect(
    useCallback(() => {
      const current = useLibraryDisplayStore.getState().resetToken;
      if (current !== lastHandled.current) {
        lastHandled.current = current;
        onReset();
      }
    }, [onReset])
  );
}
