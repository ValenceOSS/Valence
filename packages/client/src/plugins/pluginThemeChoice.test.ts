import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { choosePluginTheme, chosenPluginTheme, whenPluginThemeChanges } from './pluginThemeChoice';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('pluginThemeChoice', () => {
  it('uses Valence’s own colours until somebody chooses', () => {
    expect(chosenPluginTheme()).toBeNull();
  });

  it('remembers a choice and tells whoever is listening', () => {
    const heard = vi.fn();
    const stop = whenPluginThemeChanges(heard);

    choosePluginTheme('midnight-themes/deep-sea');

    expect(chosenPluginTheme()).toBe('midnight-themes/deep-sea');
    expect(heard).toHaveBeenCalledWith('midnight-themes/deep-sea');

    stop();
    choosePluginTheme(null);

    expect(chosenPluginTheme()).toBeNull();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('treats anything malformed as no choice', () => {
    choosePluginTheme('not a theme');

    expect(chosenPluginTheme()).toBeNull();
  });
});
