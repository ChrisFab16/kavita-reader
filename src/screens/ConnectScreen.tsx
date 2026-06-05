// src/screens/ConnectScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, ActivityIndicator, Divider, SegmentedButtons, IconButton } from 'react-native-paper';
import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';
import { useThemeStore } from '../stores/themeStore';
import { useAppTheme } from '../hooks/useAppTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Connect'>;

export default function ConnectScreen({ navigation }: Props) {
  const [connectionType, setConnectionType] = useState('ip');
  const [serverAddress, setServerAddress] = useState('');
  const [port, setPort] = useState('5000');
  const [portEnabled, setPortEnabled] = useState(true);
  const [useHttps, setUseHttps] = useState(false);

  // OPDS simplified inputs
  const [opdsAddress, setOpdsAddress] = useState('');
  const [opdsPort, setOpdsPort] = useState('5000');
  const [opdsPortEnabled, setOpdsPortEnabled] = useState(true);
  const [opdsApiKey, setOpdsApiKey] = useState('');
  const [opdsUseHttps, setOpdsUseHttps] = useState(false);

  const [loading, setLoading] = useState(false);

  const addServer = useServerStore((state) => state.addServer);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const theme = useAppTheme();

  const buildServerUrl = (): string => {
    let cleanAddress = serverAddress.trim();
    cleanAddress = cleanAddress.replace(/^https?:\/\//, '');
    cleanAddress = cleanAddress.replace(/\/$/, '');
    cleanAddress = cleanAddress.replace(/:\d+$/, '');
    const protocol = useHttps ? 'https' : 'http';
    if (portEnabled && port.trim()) {
      return `${protocol}://${cleanAddress}:${port.trim()}`;
    }
    return `${protocol}://${cleanAddress}`;
  };

  const buildOpdsUrl = (): string => {
    let cleanAddress = opdsAddress.trim();
    cleanAddress = cleanAddress.replace(/^https?:\/\//, '');
    cleanAddress = cleanAddress.replace(/\/$/, '');
    cleanAddress = cleanAddress.replace(/:\d+$/, '');
    const protocol = opdsUseHttps ? 'https' : 'http';
    const base = opdsPortEnabled && opdsPort.trim()
      ? `${protocol}://${cleanAddress}:${opdsPort.trim()}`
      : `${protocol}://${cleanAddress}`;
    return `${base}/api/opds/${opdsApiKey.trim()}`;
  };

  const extractBaseFromOpds = (): string => {
    let cleanAddress = opdsAddress.trim();
    cleanAddress = cleanAddress.replace(/^https?:\/\//, '');
    cleanAddress = cleanAddress.replace(/\/$/, '');
    cleanAddress = cleanAddress.replace(/:\d+$/, '');
    const protocol = opdsUseHttps ? 'https' : 'http';
    if (opdsPortEnabled && opdsPort.trim()) {
      return `${protocol}://${cleanAddress}:${opdsPort.trim()}`;
    }
    return `${protocol}://${cleanAddress}`;
  };

  const handleConnect = async () => {
    if (connectionType === 'ip') {
      if (!serverAddress.trim()) {
        Alert.alert('Error', 'Please enter a server address');
        return;
      }
      if (portEnabled && (!port.trim() || isNaN(Number(port)))) {
        Alert.alert('Error', 'Please enter a valid port number, or disable the port for reverse proxy setups');
        return;
      }
    } else {
      if (!opdsAddress.trim()) {
        Alert.alert('Error', 'Please enter a server address');
        return;
      }
      if (!opdsApiKey.trim()) {
        Alert.alert('Error', 'Please enter your OPDS API key');
        return;
      }
    }

    setLoading(true);

    try {
      const serverUrl = connectionType === 'ip' ? buildServerUrl() : extractBaseFromOpds();
      const client = new KavitaClient(serverUrl);
      const isConnected = await client.testConnection();

      if (!isConnected) {
        Alert.alert(
          'Connection Failed',
          'Cannot reach the server. Please check:\n\n' +
          '• Server is running\n' +
          '• Address is correct\n' +
          '• You\'re on the same network (or have remote access set up)\n' +
          (portEnabled
            ? '• Port number is correct\n• Try toggling HTTP/HTTPS'
            : '• Try enabling HTTPS if your reverse proxy requires it') +
          `\n\nAttempted: ${serverUrl}`
        );
        setLoading(false);
        return;
      }

      navigation.navigate('Login', { serverUrl });

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    Alert.alert(
      'Demo Mode',
      'This will let you explore the app with sample content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Try Demo',
          onPress: () => {
            addServer({
              name: 'Demo Library',
              url: 'https://demo.kavitareader.com',
              type: 'kavita',
              isDefault: true,
            });
            navigation.navigate('Home');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.topBar}>
          <IconButton
            icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
            size={24}
            iconColor={theme.primary}
            onPress={toggleDarkMode}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏡</Text>
            </View>

            <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
              KavitaReader
            </Text>

            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Connect to your Kavita library
            </Text>

            <SegmentedButtons
              value={connectionType}
              onValueChange={setConnectionType}
              buttons={[
                { value: 'ip', label: 'IP / Hostname', icon: 'ip-network' },
                { value: 'opds', label: 'OPDS', icon: 'rss' },
              ]}
              style={styles.segmentedButtons}
              theme={{ colors: { secondaryContainer: theme.primaryLight } }}
            />

            {connectionType === 'ip' && (
              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                  Server Address
                </Text>
                <TextInput
                  value={serverAddress}
                  onChangeText={setServerAddress}
                  placeholder="192.168.1.100  or  myserver.com"
                  mode="outlined"
                  style={[styles.input, { backgroundColor: theme.surface }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  left={<TextInput.Icon icon="server" />}
                  disabled={loading}
                  textColor={theme.text}
                  placeholderTextColor={theme.textTertiary}
                />

                <View style={styles.portHeaderRow}>
                  <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>Port</Text>
                  <Button mode="text" compact onPress={() => setPortEnabled(!portEnabled)}
                    textColor={portEnabled ? theme.textSecondary : theme.accent}>
                    {portEnabled ? 'Disable (reverse proxy)' : 'Enable port'}
                  </Button>
                </View>

                {portEnabled ? (
                  <View style={styles.portSpinnerContainer}>
                    <Button mode="outlined" onPress={() => { const p = parseInt(port)||5000; if(p>1) setPort(String(p-1)); }}
                      disabled={loading} style={[styles.portButton, { borderColor: theme.primary }]} textColor={theme.primary} compact>-</Button>
                    <TextInput value={port} onChangeText={(t) => { const n=t.replace(/[^0-9]/g,''); if(n===''||(parseInt(n)>=1&&parseInt(n)<=65535)) setPort(n); }}
                      mode="outlined" keyboardType="numeric" style={[styles.portInputCenter, { backgroundColor: theme.surface }]}
                      disabled={loading} textColor={theme.text} />
                    <Button mode="outlined" onPress={() => { const p = parseInt(port)||5000; if(p<65535) setPort(String(p+1)); }}
                      disabled={loading} style={[styles.portButton, { borderColor: theme.primary }]} textColor={theme.primary} compact>+</Button>
                  </View>
                ) : (
                  <Text variant="bodySmall" style={[styles.hint, { color: theme.accent }]}>
                    ✓ Port disabled — reverse proxy mode
                  </Text>
                )}

                <View style={[styles.httpsContainer, { marginTop: portEnabled ? 12 : 4 }]}>
                  <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>Protocol</Text>
                  <SegmentedButtons value={useHttps ? 'https' : 'http'} onValueChange={(v) => setUseHttps(v === 'https')}
                    buttons={[{ value: 'http', label: 'HTTP' }, { value: 'https', label: 'HTTPS' }]}
                    style={styles.protocolButtons} density="small" />
                </View>

                <Text variant="bodySmall" style={[styles.hint, { color: theme.textTertiary }]}>
                  {portEnabled ? 'Default Kavita port is 5000. Use HTTP for local networks.' : 'Reverse proxy setups typically use HTTPS.'}
                </Text>

                <View style={[styles.previewContainer, { backgroundColor: theme.card }]}>
                  <Text variant="bodySmall" style={[styles.previewLabel, { color: theme.primary }]}>Will connect to:</Text>
                  <Text variant="bodyMedium" style={[styles.previewUrl, { color: theme.text }]}>
                    {serverAddress ? buildServerUrl() : 'Enter server address above'}
                  </Text>
                </View>
              </View>
            )}

            {connectionType === 'opds' && (
              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                  Server Address
                </Text>
                <TextInput
                  value={opdsAddress}
                  onChangeText={setOpdsAddress}
                  placeholder="192.168.1.100  or  myserver.com"
                  mode="outlined"
                  style={[styles.input, { backgroundColor: theme.surface }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  left={<TextInput.Icon icon="server" />}
                  disabled={loading}
                  textColor={theme.text}
                  placeholderTextColor={theme.textTertiary}
                />

                <View style={styles.portHeaderRow}>
                  <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>Port</Text>
                  <Button mode="text" compact onPress={() => setOpdsPortEnabled(!opdsPortEnabled)}
                    textColor={opdsPortEnabled ? theme.textSecondary : theme.accent}>
                    {opdsPortEnabled ? 'Disable (reverse proxy)' : 'Enable port'}
                  </Button>
                </View>

                {opdsPortEnabled ? (
                  <View style={styles.portSpinnerContainer}>
                    <Button mode="outlined" onPress={() => { const p=parseInt(opdsPort)||5000; if(p>1) setOpdsPort(String(p-1)); }}
                      disabled={loading} style={[styles.portButton, { borderColor: theme.primary }]} textColor={theme.primary} compact>-</Button>
                    <TextInput value={opdsPort} onChangeText={(t) => { const n=t.replace(/[^0-9]/g,''); if(n===''||(parseInt(n)>=1&&parseInt(n)<=65535)) setOpdsPort(n); }}
                      mode="outlined" keyboardType="numeric" style={[styles.portInputCenter, { backgroundColor: theme.surface }]}
                      disabled={loading} textColor={theme.text} />
                    <Button mode="outlined" onPress={() => { const p=parseInt(opdsPort)||5000; if(p<65535) setOpdsPort(String(p+1)); }}
                      disabled={loading} style={[styles.portButton, { borderColor: theme.primary }]} textColor={theme.primary} compact>+</Button>
                  </View>
                ) : (
                  <Text variant="bodySmall" style={[styles.hint, { color: theme.accent }]}>
                    ✓ Port disabled — reverse proxy mode
                  </Text>
                )}

                <View style={[styles.httpsContainer, { marginTop: opdsPortEnabled ? 12 : 4 }]}>
                  <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>Protocol</Text>
                  <SegmentedButtons value={opdsUseHttps ? 'https' : 'http'} onValueChange={(v) => setOpdsUseHttps(v === 'https')}
                    buttons={[{ value: 'http', label: 'HTTP' }, { value: 'https', label: 'HTTPS' }]}
                    style={styles.protocolButtons} density="small" />
                </View>

                <Text variant="labelLarge" style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                  OPDS API Key
                </Text>
                <TextInput
                  value={opdsApiKey}
                  onChangeText={setOpdsApiKey}
                  placeholder="017a75c1-3c6f-4f49-bdb1-d45d0d4aaf23"
                  mode="outlined"
                  style={[styles.input, { backgroundColor: theme.surface }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  left={<TextInput.Icon icon="key" />}
                  disabled={loading}
                  textColor={theme.text}
                  placeholderTextColor={theme.textTertiary}
                />

                <Text variant="bodySmall" style={[styles.hint, { color: theme.textTertiary }]}>
                  Find your OPDS API key in Kavita → User Settings → OPDS
                </Text>

                {opdsAddress && opdsApiKey ? (
                  <View style={[styles.previewContainer, { backgroundColor: theme.card }]}>
                    <Text variant="bodySmall" style={[styles.previewLabel, { color: theme.primary }]}>OPDS URL:</Text>
                    <Text variant="bodyMedium" style={[styles.previewUrl, { color: theme.text }]}>{buildOpdsUrl()}</Text>
                  </View>
                ) : null}
              </View>
            )}

            <Button mode="contained" onPress={handleConnect} disabled={loading}
              style={styles.connectButton} buttonColor={theme.accent} contentStyle={styles.buttonContent}>
              {loading ? 'Connecting...' : 'Connect Server'}
            </Button>

            {loading && <ActivityIndicator style={styles.loader} color={theme.primary} />}

            <View style={styles.dividerContainer}>
              <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text variant="labelMedium" style={[styles.dividerText, { color: theme.textSecondary }]}>DEMO MODE</Text>
              <Divider style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <Button mode="outlined" onPress={handleDemoMode}
              style={[styles.demoButton, { borderColor: theme.textSecondary }]}
              textColor={theme.textSecondary} contentStyle={styles.buttonContent}>
              Try Demo Library
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  topBar: { position: 'absolute', top: 8, right: 8, zIndex: 10 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxWidth: 500, width: '100%', alignSelf: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 48 },
  title: { textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  subtitle: { textAlign: 'center', marginBottom: 16 },
  segmentedButtons: { marginBottom: 16 },
  inputContainer: { marginBottom: 16 },
  label: { marginBottom: 6 },
  input: { marginBottom: 12 },
  portHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  portSpinnerContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portButton: { minWidth: 48 },
  portInputCenter: { flex: 1, textAlign: 'center' },
  httpsContainer: { marginBottom: 6 },
  protocolButtons: {},
  hint: { fontSize: 11, marginBottom: 10 },
  previewContainer: { padding: 10, borderRadius: 8, marginTop: 6 },
  previewLabel: { marginBottom: 3, fontSize: 11 },
  previewUrl: { fontWeight: '500', fontSize: 13 },
  connectButton: { marginBottom: 12 },
  buttonContent: { paddingVertical: 6 },
  loader: { marginVertical: 12 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divider: { flex: 1 },
  dividerText: { marginHorizontal: 12, fontWeight: '500', fontSize: 11 },
  demoButton: { marginBottom: 20 },
});