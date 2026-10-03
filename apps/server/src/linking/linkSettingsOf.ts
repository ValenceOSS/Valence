import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { LinkSettings } from './LinkSettings';

/**
 * This server's own linking settings — its key, name, colour and address — read from and written
 * to where the rest of its settings are kept.
 *
 * @param settings - The server's settings.
 * @returns How the link service reads and writes its own.
 */
const linkSettingsOf = (settings: SettingsStore) => ({
  read: async (): Promise<LinkSettings> => (await settings.read()).linking,
  write: async (next: LinkSettings): Promise<void> => {
    await settings.write({ linking: next });
  },
});

export { linkSettingsOf };
