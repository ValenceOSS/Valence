import { describe, expect, it } from 'vitest';
import { NOT_AN_EPISODE } from './NOT_AN_EPISODE';
import { NO_IDS } from './NO_IDS';
import { releaseVersionsOfGone } from './releaseVersionsOfGone';
import type { Placement } from './Placement.types';

const FOLDER = '/anime/Love and Lies (2017)/Season 01';

const OLD = `${FOLDER}/Love and Lies (2017) - S01E01 - First Love [1080p][x264][AC3 2.0].mkv`;

const NEW = `${FOLDER}/Love and Lies (2017) - S01E01 - First Love [1080p][x265][Opus 2.0].mkv`;

const SECOND = `${FOLDER}/Love and Lies (2017) - S01E01 - First Love [720p][x265][Opus 2.0].mkv`;

const placement = (version: Placement['version'] = null): Placement => ({
  isIgnored: false,
  title: 'Love and Lies',
  year: 2017,
  episode: NOT_AN_EPISODE,
  ids: NO_IDS,
  nfoPaths: [],
  extra: null,
  version,
});

describe('releaseVersionsOfGone', () => {
  it('makes the copy still on disk the episode itself where the file it was a version of is gone', () => {
    const { placed, released } = releaseVersionsOfGone(
      new Map([
        [OLD, placement()],
        [NEW, placement({ parentPath: OLD, label: '5][Opus 2.0' })],
      ]),
      (path) => path !== OLD,
    );

    expect(placed.get(NEW)?.version).toBeNull();
    expect(released).toEqual([NEW]);
  });

  it('files the other copies still on disk as versions of the one that took its place', () => {
    const { placed, released } = releaseVersionsOfGone(
      new Map([
        [OLD, placement()],
        [SECOND, placement({ parentPath: OLD, label: '720p' })],
        [NEW, placement({ parentPath: OLD, label: '1080p' })],
      ]),
      (path) => path !== OLD,
    );

    expect(released).toEqual([NEW]);
    expect(placed.get(NEW)?.version).toBeNull();
    expect(placed.get(SECOND)?.version?.parentPath).toBe(NEW);
  });

  it('leaves a version whose file is still there, and one that is itself gone, as they were', () => {
    const versions = new Map([
      [OLD, placement()],
      [NEW, placement({ parentPath: OLD, label: 'x265' })],
      [SECOND, placement({ parentPath: NEW, label: '720p' })],
    ]);

    expect(releaseVersionsOfGone(versions, () => true).released).toEqual([]);
    expect(releaseVersionsOfGone(versions, (path) => path === OLD).released).toEqual([]);
  });
});
