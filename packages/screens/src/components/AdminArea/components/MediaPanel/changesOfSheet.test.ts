import { describe, expect, it } from 'vitest';
import { TitleRowSchema } from '@ValenceContracts/schemas/TitleList';
import { changesOfSheet } from './changesOfSheet';

const LOOKS = {
  step: null,
  isStepMixed: false,
  range: null,
  isRangeMixed: false,
  codec: null,
  isCodecMixed: false,
  audio: null,
  isAudioMixed: false,
};

/**
 * A film as the list gives it.
 *
 * @param id - Its file, and its TMDB id.
 * @param name - What it is called.
 * @returns The row.
 */
const aFilm = (id: string, name: string) =>
  TitleRowSchema.parse({
    id: `movie:${id}`,
    key: `movie:${id}`,
    kind: 'film',
    libraryId: '00000000-0000-4000-8000-000000000002',
    lead: {
      id: `00000000-0000-4000-8000-00000000000${id}`,
      libraryId: '00000000-0000-4000-8000-000000000002',
      title: name,
      year: 2001,
      durationSeconds: 6000,
      width: 1920,
      height: 1080,
      videoCodec: 'h264',
      videoRange: 'SDR',
      addedAt: '2026-01-02T03:04:05.000Z',
      genres: ['Drama'],
      externalId: id,
      releaseDate: '2001-05-04',
    },
    name,
    order: name,
    year: 2001,
    files: 1,
    versions: 0,
    seasons: 0,
    episodes: 0,
    sizeBytes: 100,
    durationSeconds: 6000,
    latestAddedAt: '2026-01-02T03:04:05.000Z',
    isMatched: true,
    posterFrom: null,
    folder: null,
    leadPath: null,
    looks: LOOKS,
    problemFiles: { duplicate: [], unreadable: [] },
    isEdited: false,
  });

const HEADING = ['kind', 'title', 'sort_title', 'year', 'release_date', 'genres', 'tmdb_id'];

describe('changesOfSheet', () => {
  it('finds each row by its TMDB id and keeps only what differs', () => {
    const { changes, unfound } = changesOfSheet(
      [
        HEADING,
        ['film', 'One Renamed', 'One', '2001', '2001-05-04', 'Drama; War', '1'],
        ['film', 'Two', '', '2001', '2001-05-04', 'Drama', '2'],
        ['film', 'Nowhere', '', '', '', '', '9'],
      ],
      [aFilm('1', 'One'), aFilm('2', 'Two')],
    );

    expect(unfound).toBe(1);
    expect(changes.map(({ row, set }) => ({ id: row.lead.externalId, set }))).toEqual([
      { id: '1', set: { title: 'One Renamed', sortTitle: 'One', genres: ['Drama', 'War'] } },
    ]);
  });

  it('finds a row with no TMDB id by its title and year, never renaming it', () => {
    const { changes } = changesOfSheet(
      [
        ['kind', 'title', 'year', 'release_date'],
        ['film', 'two', '2001', '2002-01-01'],
      ],
      [aFilm('2', 'Two')],
    );

    expect(changes[0]?.set).toEqual({ releaseDate: '2002-01-01' });
  });
});
