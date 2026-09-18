import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  DEFAULT_MUSIC_PREFERENCES,
  STORAGE_KEY,
  readMusicPreferences,
  saveMusicPreferences,
} from './musicPreferences';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('musicPreferences', () => {
  it('listens losslessly until told otherwise', () => {
    expect(readMusicPreferences()).toEqual(DEFAULT_MUSIC_PREFERENCES);
  });

  it('keeps the quality chosen on this device', () => {
    saveMusicPreferences({ quality: 'low' });

    expect(readMusicPreferences().quality).toBe('low');
  });

  it('keeps one change without losing the others', () => {
    saveMusicPreferences({ volume: 0.3 });
    saveMusicPreferences({ isMuted: true });

    expect(readMusicPreferences()).toMatchObject({ volume: 0.3, isMuted: true });
  });

  it('falls back to the defaults where what was kept will not read', () => {
    platformInUse().store.write(STORAGE_KEY, 'not json');

    expect(readMusicPreferences()).toEqual(DEFAULT_MUSIC_PREFERENCES);
  });
});
