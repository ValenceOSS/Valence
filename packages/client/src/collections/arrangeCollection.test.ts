import { describe, expect, it } from 'vitest';
import { arrangeCollection } from './arrangeCollection';
import type { CollectionEntry } from '@ValenceContracts/schemas/Collection';

/**
 * An entry of a collection with only what arranging it reads.
 *
 * @param title - What it is called.
 * @param year - When it came out.
 * @param seriesTitle - The programme it stands for, where it is one.
 * @returns The entry.
 */
const anEntry = (title: string, year: number | null, seriesTitle?: string): CollectionEntry => ({
  id: title,
  position: 0,
  addedAt: '2026-10-02T00:00:00.000Z',
  kind: seriesTitle === undefined ? 'film' : 'series',
  media: {
    id: title,
    libraryId: 'library',
    title,
    year,
    durationSeconds: 60,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    videoRange: 'SDR',
    addedAt: '2026-10-02T00:00:00.000Z',
    hasPoster: false,
    hasBackdrop: false,
    hasLogo: false,
    seriesId: seriesTitle === undefined ? null : 'series',
    ...(seriesTitle === undefined ? {} : { seriesTitle }),
  },
});

const PLACED = [
  anEntry('Return', 1983),
  anEntry('Pilot', 1990, 'Archive'),
  anEntry('Hope', 1977),
  anEntry('Undated', null),
  anEntry('Empire', 1980),
];

const titles = (entries: readonly CollectionEntry[]) => entries.map((entry) => entry.id);

describe('arrangeCollection', () => {
  it('keeps the order it was placed in', () => {
    expect(titles(arrangeCollection(PLACED, 'position'))).toEqual(titles(PLACED));
  });

  it('lays it out oldest first, with anything undated last', () => {
    expect(titles(arrangeCollection(PLACED, 'year'))).toEqual([
      'Hope',
      'Empire',
      'Return',
      'Pilot',
      'Undated',
    ]);
  });

  it('lays it out by name, a programme by its own', () => {
    expect(titles(arrangeCollection(PLACED, 'title'))).toEqual([
      'Pilot',
      'Empire',
      'Hope',
      'Return',
      'Undated',
    ]);
  });

  it('leaves what it was given as it was', () => {
    const given = [...PLACED];

    arrangeCollection(given, 'title');

    expect(given).toEqual(PLACED);
  });
});
