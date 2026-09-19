import { describe, expect, it } from 'vitest';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { groupIntoThings } from './groupIntoThings';

const GIGABYTE = 1024 ** 3;

const file = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'item-1',
  libraryId: 'library-1',
  title: 'Azkaban',
  year: 2004,
  durationSeconds: 8520,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  sizeBytes: GIGABYTE,
  ...overrides,
});

describe('groupIntoThings', () => {
  it('gathers a programme episodes under the programme', () => {
    const groups = groupIntoThings([
      file({ id: 'a', title: 'Charm Offensive', seriesTitle: 'Pluribus' }),
      file({ id: 'b', title: 'Grace', seriesTitle: 'Pluribus' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.title).toBe('Pluribus');
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('gathers a film cuts under the film, which is the same question asked of a shelf', () => {
    const groups = groupIntoThings([
      file({ id: 'film', title: 'Parasite', parentId: null }),
      file({ id: 'bw', title: 'Parasite', parentId: 'film', versionLabel: 'B&W' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.title).toBe('Parasite');
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('keeps an ordinary film on its own', () => {
    const groups = groupIntoThings([file({ id: 'a', title: 'Azkaban' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items).toHaveLength(1);
  });

  it('adds up what a whole thing costs', () => {
    const groups = groupIntoThings([
      file({ id: 'a', seriesTitle: 'ted', sizeBytes: 2 * GIGABYTE }),
      file({ id: 'b', seriesTitle: 'ted', sizeBytes: 3 * GIGABYTE }),
    ]);

    expect(groups[0]?.sizeBytes).toBe(5 * GIGABYTE);
  });

  it('counts a file whose size nobody recorded as nothing rather than refusing to add up', () => {
    const groups = groupIntoThings([
      file({ id: 'a', seriesTitle: 'ted', sizeBytes: GIGABYTE }),
      file({ id: 'b', seriesTitle: 'ted', sizeBytes: null }),
    ]);

    expect(groups[0]?.sizeBytes).toBe(GIGABYTE);
  });

  it('reads the episodes in the order somebody watches them', () => {
    const groups = groupIntoThings([
      file({ id: 'b', title: 'Two', seriesTitle: 'ted', seasonNumber: 1, episodeNumber: 2 }),
      file({ id: 'a', title: 'One', seriesTitle: 'ted', seasonNumber: 1, episodeNumber: 1 }),
      file({ id: 'c', title: 'Next', seriesTitle: 'ted', seasonNumber: 2, episodeNumber: 1 }),
    ]);

    expect(groups[0]?.items.map((one) => one.id)).toEqual(['a', 'b', 'c']);
  });

  it('puts the things in an order somebody can scan', () => {
    const groups = groupIntoThings([
      file({ id: 'b', title: 'Zodiac' }),
      file({ id: 'a', title: 'Arrival' }),
    ]);

    expect(groups.map((one) => one.title)).toEqual(['Arrival', 'Zodiac']);
  });

  it('names a programme by the programme even when only an episode is left after filtering', () => {
    const groups = groupIntoThings([
      file({ id: 'a', title: 'Charm Offensive', seriesTitle: 'Pluribus' }),
    ]);

    expect(groups[0]?.title).toBe('Pluribus');
  });

  it('answers with nothing for nothing', () => {
    expect(groupIntoThings([])).toEqual([]);
  });
});
