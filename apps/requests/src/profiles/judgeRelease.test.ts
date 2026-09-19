import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { judgeRelease } from './judgeRelease';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Judges a release of the name given.
 */
const judge = (
  title: string,
  profile: QualityProfile = aProfile(),
  overrides: Partial<Release> = {},
  runtimeMinutes?: number,
) => judgeRelease(aRelease(title, overrides), parseReleaseName(title), profile, runtimeMinutes);

const GB = 1024 ** 3;

describe('judgeRelease', () => {
  it('scores a release by how far up its resolution and source come, and says so', () => {
    expect(judge('Dune.2021.1080p.BluRay.x264-GRP')).toMatchObject({
      releaseId: 'Dune.2021.1080p.BluRay.x264-GRP',
      score: 2000 + 400,
      isRejected: false,
      rejections: [],
      reasons: ['1080p, the first choice', 'Blu-ray, the second choice'],
    });
    expect(judge('Dune.2021.720p.WEB-DL.x264-GRP').score).toBe(1000 + 300);
  });

  it('refuses a resolution or source the profile does not take, or a name without a resolution', () => {
    expect(judge('Dune.2021.2160p.BluRay.x265-GRP').rejections).toEqual([
      '2160p is not one this profile takes',
    ]);
    expect(judge('Dune.2021.1080p.HDCAM.x264-GRP').rejections).toEqual([
      'A cinema recording is not one this profile takes',
    ]);
    expect(judge('Dune.2021.BluRay.x264-GRP')).toMatchObject({
      isRejected: true,
      rejections: ['It does not say its resolution'],
    });
  });

  it('lets a release through unscored where it does not say its source', () => {
    expect(judge('[ASW] One Piece - 1100 [1080p HEVC]')).toMatchObject({
      isRejected: false,
      score: 2000,
    });
  });

  it('names a choice far down the list by its number', () => {
    const profile = aProfile({
      sources: ['remux', 'bluray', 'webdl', 'webrip', 'hdtv', 'dvd'],
    });

    expect(judge('Dune.2021.1080p.DVDRip.x264-GRP', profile).reasons).toContain(
      'DVD, the number 6 choice',
    );
  });

  it('refuses banned words, and a release missing every required one', () => {
    const profile = aProfile({ bannedWords: ['x264', '/\\b3d\\b/'], requiredWords: ['HDR', 'DV'] });

    expect(judge('Dune.2021.1080p.3D.BluRay.x264-GRP', profile).rejections).toEqual([
      'It has “x264”, which is banned',
      'It has “/\\b3d\\b/”, which is banned',
      'It has none of the words it must: HDR, DV',
    ]);
    expect(judge('Dune.2021.1080p.BluRay.HDR.x265-GRP', profile).isRejected).toBe(false);
  });

  it('adds for each preferred word, and for a proper or a repack', () => {
    const profile = aProfile({ preferredWords: ['Atmos', 'FLUX'] });

    const liked = judge('Dune.2021.1080p.WEB-DL.DDP5.1.Atmos.H.265-FLUX', profile);

    expect(liked.score).toBe(2000 + 300 + 20);
    expect(liked.reasons).toContain('It has “Atmos” (+10)');
    expect(liked.reasons).toContain('It has “FLUX” (+10)');
    expect(judge('Dune.2021.PROPER.1080p.BluRay.x264-GRP').reasons).toContain(
      'A proper, a better release of the same thing (+5)',
    );
    expect(judge('Dune.2021.REPACK.1080p.BluRay.x264-GRP').score).toBe(2000 + 400 + 5);
  });

  it('refuses a torrent nobody seeds, but not an NZB', () => {
    expect(judge('Dune.2021.1080p.BluRay.x264-GRP', aProfile(), { seeders: 0 }).rejections).toEqual(
      ['Nobody is seeding it'],
    );
    expect(
      judge('Dune.2021.1080p.BluRay.x264-GRP', aProfile(), { protocol: 'usenet', seeders: 0 })
        .isRejected,
    ).toBe(false);
  });

  it('judges video by size an hour, once it knows the running time', () => {
    const profile = aProfile({ smallestMb: 1000, largestMb: 8000 });
    const film = 'Dune.2021.1080p.BluRay.x264-GRP';

    expect(judge(film, profile, { sizeBytes: 10 * GB }).reasons).toContain(
      'Its size is not judged without a running time',
    );
    expect(judge(film, profile, { sizeBytes: 10 * GB }, 120).isRejected).toBe(false);
    expect(judge(film, profile, { sizeBytes: 20 * GB }, 120).rejections).toEqual([
      'At 10,240 MB an hour it is larger than this profile takes, 8,000',
    ]);
    expect(judge(film, profile, { sizeBytes: 1 * GB }, 120).rejections).toEqual([
      'At 512 MB an hour it is smaller than this profile takes, 1,000',
    ]);
  });

  it('judges several episodes by their time together, and leaves a whole season be', () => {
    const profile = aProfile({ largestMb: 3000 });

    expect(
      judge('Show.S01E01E02.1080p.WEB-DL.x264-GRP', profile, { sizeBytes: 4 * GB }, 60).isRejected,
    ).toBe(false);
    expect(
      judge('Show.S01.1080p.WEB-DL.x264-GRP', profile, { sizeBytes: 40 * GB }, 60).reasons,
    ).toContain('Its size is not judged, since it is a whole season');
  });

  it('judges nothing by size where there are no limits, or no size', () => {
    expect(
      judge('Dune.2021.1080p.BluRay.x264-GRP', aProfile(), { sizeBytes: 90 * GB }, 120).isRejected,
    ).toBe(false);
    expect(
      judge('Dune.2021.1080p.BluRay.x264-GRP', aProfile({ largestMb: 1 }), { sizeBytes: null }, 120)
        .isRejected,
    ).toBe(false);
  });

  it('judges music by its encoding, and its size per album', () => {
    const profile = aProfile({
      kind: 'music',
      musicQualities: ['flac', 'mp3-320'],
      largestMb: 2000,
    });

    expect(judge('Daft Punk - Discovery (2001) [FLAC]', profile)).toMatchObject({
      score: 2000,
      reasons: ['FLAC, the first choice'],
    });
    expect(judge('Daft Punk - Discovery (2001) [MP3 V0]', profile).rejections).toEqual([
      'MP3 at V0 is not one this profile takes',
    ]);
    expect(judge('Daft Punk - Discovery (2001)', profile).rejections).toEqual([
      'It does not say how it was encoded',
    ]);
    expect(
      judge('Daft Punk - Discovery (2001) [FLAC]', profile, { sizeBytes: 3 * GB }).rejections,
    ).toEqual(['At 3,072 MB it is larger than this profile takes, 2,000']);
  });
});
