// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';
import { useAppTheme } from '../hooks/useAppTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { serverUrl } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const addServer = useServerStore((state) => state.addServer);
  const removeServer = useServerStore((state) => state.removeServer);
  const theme = useAppTheme();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);

    // Track whether we added a server so we can roll back on failure
    let addedServerId: string | null = null;

    try {
      // Login first — don't add server until we know credentials work
      const client = new KavitaClient(serverUrl);
      await client.login(username, password);

      // Login succeeded — now persist the server to the store
      addServer({
        name: serverUrl.replace(/^https?:\/\//, ''),
        url: serverUrl,
        type: 'kavita',
        isDefault: true,
      });

      // Navigate immediately — no success alert, just get out of the way
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });

    } catch (error: any) {
      // Roll back server entry if it was added before the failure
      if (addedServerId) {
        removeServer(addedServerId);
      }

      // Give the user a specific, actionable error message
      let message = error.message || 'Unknown error';

      if (
        error.message?.includes('Network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('No response')
      ) {
        message = 'Could not reach the server. Check the URL and make sure your Kavita server is running.';
      } else if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        message = 'Incorrect username or password.';
      }

      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          iconColor={theme.text}
        />

        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { backgroundColor: theme.primaryLight + '30' }]}>📚</Text>
        </View>

        <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
          Sign In
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {serverUrl.replace(/^https?:\/\//, '')}
        </Text>

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={[styles.input, { backgroundColor: theme.surface }]}
          autoCapitalize="none"
          autoCorrect={false}
          left={<TextInput.Icon icon="account" />}
          disabled={loading}
          textColor={theme.text}
          placeholderTextColor={theme.textTertiary}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          style={[styles.input, { backgroundColor: theme.surface }]}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          disabled={loading}
          textColor={theme.text}
          placeholderTextColor={theme.textTertiary}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={theme.accent}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loader: {
    marginTop: 16,
  },
});