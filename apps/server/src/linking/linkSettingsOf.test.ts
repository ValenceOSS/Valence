import { describe, expect, it } from 'vitest';
import { linkSettingsOf } from './linkSettingsOf';
import { LINK_SETTINGS_DEFAULTS } from './LinkSettings';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';

describe('linkSettingsOf', () => {
  it('reads and writes linking within the server’s own settings', async () => {
    const settings = createMemorySettingsStore(
      ServerSettingsSchema.parse({
        trustedOrigins: [],
        cookieSecure: false,
        setupCompletedAt: null,
      }),
    );
    const linking = linkSettingsOf(settings);

    expect(await linking.read()).toEqual(LINK_SETTINGS_DEFAULTS);

    await linking.write({ ...LINK_SETTINGS_DEFAULTS, name: 'Anime' });

    expect((await settings.read()).linking.name).toBe('Anime');
  });
});
