import React from 'react';
import { View } from 'react-native';
import { IconButton } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onRefresh: () => void;
  refreshing?: boolean;
  showSettings?: boolean;
  searchActive?: boolean;
  onSearchPress?: () => void;
};

export default function ScreenHeaderActions({
  navigation,
  onRefresh,
  refreshing = false,
  showSettings = true,
  searchActive = false,
  onSearchPress,
}: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {onSearchPress ? (
        <IconButton
          icon={searchActive ? 'close' : 'magnify'}
          iconColor="#fff"
          size={24}
          onPress={onSearchPress}
          accessibilityLabel={searchActive ? 'Close search' : 'Search'}
        />
      ) : null}
      <IconButton
        icon="refresh"
        iconColor="#fff"
        size={24}
        disabled={refreshing}
        onPress={onRefresh}
        accessibilityLabel="Refresh"
      />
      {showSettings ? (
        <IconButton
          icon="cog"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Settings"
        />
      ) : null}
    </View>
  );
}
