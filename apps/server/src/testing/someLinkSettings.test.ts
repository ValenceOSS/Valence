import { describe, expect, it } from 'vitest';
import { LINK_SETTINGS_DEFAULTS } from '@ValenceServer/linking/LinkSettings';
import { someLinkSettings } from './someLinkSettings';

describe('someLinkSettings', () => {
  it('starts from the defaults, and reads back what was written', async () => {
    const settings = someLinkSettings();

    expect(await settings.read()).toEqual(LINK_SETTINGS_DEFAULTS);

    await settings.write({ ...LINK_SETTINGS_DEFAULTS, name: 'Anime' });

    expect((await settings.read()).name).toBe('Anime');
  });
});
