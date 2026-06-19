// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import ConnectScreen from '../screens/ConnectScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryDetailScreen from '../screens/LibraryDetailScreen';
import SeriesDetailScreen from '../screens/SeriesDetailScreen';
import ReaderScreen from '../screens/ReaderScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import type { SeriesGridMode } from '../types/kavita';

export type RootStackParamList = {
  Connect: undefined;
  Login: { serverUrl: string };
  Home: undefined;
  LibraryDetail: {
    libraryId?: number;
    libraryName: string;
    collectionId?: number;
    gridMode?: SeriesGridMode;
  };
  SeriesDetail: { seriesId: number; seriesName?: string; seriesSummary?: string };
  Reader: {
    chapterId: number;
    seriesId: number;
    volumeId?: number;
    libraryId?: number;
    chapterFormat?: number;
    fileName?: string;
  };
  Settings: undefined;
  Downloads: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  theme: NavTheme;
  initialRouteName?: keyof RootStackParamList;
}

export default function AppNavigator({ theme, initialRouteName = 'Connect' }: AppNavigatorProps) {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator 
        id="main-stack"
        initialRouteName={initialRouteName}
        screenOptions={{
          headerStyle: { 
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="Connect" 
          component={ConnectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'My Libraries',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen 
          name="LibraryDetail" 
          component={LibraryDetailScreen}
          options={({ route }) => ({ 
            title: route.params.libraryName,
          })}
        />
        <Stack.Screen 
          name="SeriesDetail" 
          component={SeriesDetailScreen}
          options={({ navigation }) => ({ 
            title: 'Series Details',
            headerRight: () => (
              <IconButton
                icon="cog"
                iconColor="#fff"
                size={24}
                onPress={() => navigation.navigate('Settings')}
              />
            ),
          })}
        />
        <Stack.Screen 
          name="Reader" 
          component={ReaderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="Downloads"
          component={DownloadsScreen}
          options={{
            title: 'Downloads',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}