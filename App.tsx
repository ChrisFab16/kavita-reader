// App.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { lightTheme, darkTheme } from './src/utils/theme';
import { resolveInitialRoute, waitForServerStoreHydration, type InitialRoute } from './src/utils/sessionBootstrap';

export default function App() {
  const [boot, setBoot] = useState<{ ready: false } | { ready: true; initialRoute: InitialRoute }>({ ready: false });
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await waitForServerStoreHydration();
      const initialRoute = await resolveInitialRoute();
      if (!cancelled) {
        setBoot({ ready: true, initialRoute });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Memoize the paper theme to prevent unnecessary recalculations
  const paperTheme = useMemo(() => {
    const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
    const appTheme = isDarkMode ? darkTheme : lightTheme;
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: appTheme.primary,
        primaryContainer: appTheme.primaryLight,
        secondary: appTheme.accent,
        secondaryContainer: appTheme.accentLight,
        background: appTheme.background,
        surface: appTheme.surface,
        error: appTheme.error,
      },
    };
  }, [isDarkMode]);

  // Memoize the navigation theme
  const navigationTheme = useMemo(() => {
    const appTheme = isDarkMode ? darkTheme : lightTheme;
    
    return {
      dark: isDarkMode,
      colors: {
        primary: appTheme.primary,
        background: appTheme.background,
        card: appTheme.surface,
        text: appTheme.text,
        border: appTheme.border,
        notification: appTheme.accent,
      },
      fonts: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '700' as const,
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '900' as const,
        },
      },
    };
  }, [isDarkMode]);

  if (!boot.ready) {
    const loadingTheme = isDarkMode ? darkTheme : lightTheme;
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: loadingTheme.background 
      }}>
        <ActivityIndicator size="large" color={loadingTheme.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AppNavigator theme={navigationTheme} initialRouteName={boot.initialRoute} />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}