import { KavitaClient } from '../api/kavitaClient';
import { useServerStore } from '../stores/serverStore';

export type InitialRoute = 'Home' | 'Connect';

export function waitForServerStoreHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useServerStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useServerStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/** Pick first screen after boot: Home when a saved server has stored JWT credentials. */
export async function resolveInitialRoute(): Promise<InitialRoute> {
  const { servers, primaryServerId } = useServerStore.getState();
  if (servers.length === 0) {
    return 'Connect';
  }

  const serverId = primaryServerId ?? servers[0]?.id;
  const server = servers.find((s) => s.id === serverId);
  if (!server) {
    return 'Connect';
  }

  const hasCredentials = await KavitaClient.hasStoredCredentials(server.url);
  return hasCredentials ? 'Home' : 'Connect';
}
