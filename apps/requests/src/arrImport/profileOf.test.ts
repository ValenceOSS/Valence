import { describe, expect, it } from 'vitest';
import { aSetup } from '@ValenceRequests/arrImport/testing/aSetup';
import { firstOf } from '@ValenceRequests/arrImport/testing/firstOf';
import { profileOf } from './profileOf';

describe('profileOf', () => {
  it('makes a Radarr 5 profile’s qualities, cutoff and custom formats Valence’s', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const profile = firstOf(radarr.profiles.filter((one) => one.name === 'HD-1080p'));
    const { draft, notes } = profileOf(profile, 'video', radarr);

    expect(draft).toEqual({
      name: 'HD-1080p',
      kind: 'video',
      resolutions: ['1080p'],
      sources: ['bluray', 'webdl', 'webrip', 'hdtv'],
      preferredWords: ['Repack'],
      requiredWords: [],
      bannedWords: ['/[xh][ ._-]?265|\\bHEVC(\\b|\\d)/', '3D'],
      isUpgrading: true,
      upgradeUntilResolution: '1080p',
      upgradeUntilSource: 'bluray',
    });
    expect(notes.map((note) => note.message)).toEqual([
      'The custom format HDR checks more than release names, so it wasn’t imported.',
      'Valence has no equivalent for BR-DISK, so they weren’t imported.',
    ]);
  });

  it('turns a Sonarr 3 release profile’s preferred, required and ignored terms into words', async () => {
    const sonarr = await aSetup('sonarr-v3', 'sonarr', 'http://sonarr:8989');
    const { draft, notes } = profileOf(firstOf(sonarr.profiles), 'video', sonarr);

    expect(draft).toMatchObject({
      resolutions: ['1080p', '720p'],
      sources: ['bluray', 'webdl', 'hdtv'],
      preferredWords: ['/\\b(amzn|amazon)\\b/', 'REPACK'],
      requiredWords: [],
      bannedWords: ['CAM', 'TS', 'x265'],
      upgradeUntilResolution: '1080p',
      upgradeUntilSource: 'webdl',
    });
    expect(notes.map((note) => note.message)).toEqual([
      'The release profile Anime only only applies to tagged series, so it wasn’t imported.',
    ]);
  });

  it('says where a Sonarr 4 profile’s formats and least score cannot be carried', async () => {
    const sonarr = await aSetup('sonarr-v4', 'sonarr', 'http://sonarr:8989');
    const { draft, notes } = profileOf(firstOf(sonarr.profiles), 'video', sonarr);

    expect(draft).toMatchObject({
      resolutions: ['1080p'],
      sources: ['webdl', 'webrip'],
      bannedWords: ['dubbed'],
      upgradeUntilSource: 'webdl',
    });
    expect(notes.map((note) => note.message)).toEqual([
      'The custom format Not English checks more than release names, so it wasn’t imported.',
      'The minimum custom format score of 10 wasn’t imported.',
    ]);
  });

  it('says where every resolution from every source allows more than the profile did', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const { draft, notes } = profileOf(
      {
        ...firstOf(radarr.profiles),
        items: [
          { quality: { id: 4, name: 'HDTV-720p' }, items: [], allowed: true },
          { quality: { id: 7, name: 'Bluray-1080p' }, items: [], allowed: true },
        ],
      },
      'video',
      { ...radarr, releaseProfiles: [] },
    );

    expect(draft).toMatchObject({ resolutions: ['1080p', '720p'], sources: ['bluray', 'hdtv'] });
    expect(notes.map((note) => note.message)).toEqual([
      'Valence allows every selected resolution from every selected source, which is slightly less strict than before.',
    ]);
  });

  it('makes a Lidarr profile’s qualities Valence’s music qualities', async () => {
    const lidarr = await aSetup('lidarr-v2', 'lidarr', 'http://lidarr:8686');
    const { draft, notes } = profileOf(firstOf(lidarr.profiles), 'music', lidarr);

    expect(draft).toEqual({
      name: 'Lossless',
      kind: 'music',
      musicQualities: ['flac24', 'flac', 'alac', 'mp3-320'],
      preferredWords: [],
      requiredWords: [],
      bannedWords: [],
      isUpgrading: true,
      upgradeUntilMusicQuality: 'flac24',
    });
    expect(notes.map((note) => note.message)).toEqual([
      'Valence has no equivalent for WAV, so they weren’t imported.',
    ]);
  });

  it('keeps Valence’s defaults where nothing allowed can be matched', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const { draft, notes } = profileOf(
      {
        ...firstOf(radarr.profiles),
        upgradeAllowed: false,
        items: [{ quality: { id: 22, name: 'BR-DISK' }, items: [], allowed: true }],
      },
      'video',
      { ...radarr, releaseProfiles: [] },
    );

    expect(draft).not.toHaveProperty('resolutions');
    expect(draft).toMatchObject({ isUpgrading: false, upgradeUntilResolution: null });
    expect(notes.at(-1)?.message).toBe(
      'None of its qualities match Valence’s, so Valence’s defaults are used.',
    );
  });
});
