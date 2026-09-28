import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aPluginTheme } from '@ValenceClient/testing/aPluginTheme';
import { KEPT_PLUGIN_THEME_KEY } from './KEPT_PLUGIN_THEME_KEY';
import { keepPluginTheme } from './keepPluginTheme';
import { keptPluginTheme } from './keptPluginTheme';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('keepPluginTheme and keptPluginTheme', () => {
  it('keeps a theme’s colours for the choice they belong to', () => {
    keepPluginTheme('night-sky', aPluginTheme());

    expect(keptPluginTheme('night-sky/midnight')).toEqual({
      choice: 'night-sky/midnight',
      corners: 'standard',
      dark: aPluginTheme().dark,
    });
  });

  it('gives nothing for a different choice, or none', () => {
    keepPluginTheme('night-sky', aPluginTheme());

    expect(keptPluginTheme('other/theme')).toBeNull();
    expect(keptPluginTheme(null)).toBeNull();
  });

  it('forgets the colours kept', () => {
    keepPluginTheme('night-sky', aPluginTheme());
    keepPluginTheme('night-sky', null);

    expect(keptPluginTheme('night-sky/midnight')).toBeNull();
  });

  it('ignores kept colours that do not read as a theme', () => {
    platformInUse().store.write(
      KEPT_PLUGIN_THEME_KEY,
      JSON.stringify({ choice: 'a/b', dark: { accent: 'red' } }),
    );

    expect(keptPluginTheme('a/b')).toBeNull();

    platformInUse().store.write(KEPT_PLUGIN_THEME_KEY, '{not json');

    expect(keptPluginTheme('a/b')).toBeNull();
  });

  it('reads from a store it is handed, before a platform is installed', () => {
    const kept = new Map([
      [
        KEPT_PLUGIN_THEME_KEY,
        JSON.stringify({ choice: 'tv/dark', corners: 'round', dark: aPluginTheme().dark }),
      ],
    ]);

    expect(keptPluginTheme('tv/dark', { read: (key) => kept.get(key) ?? null })?.corners).toBe(
      'round',
    );
  });
});
