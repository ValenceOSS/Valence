import { describe, expect, it } from 'vitest';
import { A_NEW_PROFILE, formFor } from './readProfileForm';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';

const KEPT = aQualityProfile({
  name: 'Albums',
  kind: 'music',
  resolutions: [],
  sources: [],
  musicQualities: ['flac', 'mp3-320'],
  smallestMb: 50,
  preferredWords: ['Deluxe', 'Remastered'],
  bannedWords: ['karaoke'],
  isUpgrading: true,
  upgradeUntilMusicQuality: 'flac',
  libraryIds: ['music'],
});

describe('formFor', () => {
  it('opens a new profile on sensible choices', () => {
    expect(formFor(null)).toEqual(A_NEW_PROFILE);
    expect(A_NEW_PROFILE.resolutions).toEqual(['1080p', '720p']);
  });

  it('opens on a kept profile, its words and sizes written out', () => {
    expect(formFor(KEPT)).toMatchObject({
      name: 'Albums',
      kind: 'music',
      smallestMb: '50',
      largestMb: '',
      preferredWords: 'Deluxe, Remastered',
      bannedWords: 'karaoke',
      upgradeUntilMusicQuality: 'flac',
    });
  });
});
