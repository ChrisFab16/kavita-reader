import React from 'react';
import { View } from 'react-native';
import { IconButton } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onRefresh: () => void;
  refreshing?: boolean;
};

export default function ScreenHeaderActions({ navigation, onRefresh, refreshing = false }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconButton
        icon="refresh"
        iconColor="#fff"
        size={24}
        disabled={refreshing}
        onPress={onRefresh}
        accessibilityLabel="Refresh"
      />
      <IconButton
        icon="cog"
        iconColor="#fff"
        size={24}
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Settings"
      />
    </View>
  );
}
