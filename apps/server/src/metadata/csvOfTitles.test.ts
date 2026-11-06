import { describe, expect, it } from 'vitest';
import { TitleRowSchema } from '@ValenceContracts/schemas/TitleList';
import { csvOfTitles } from './csvOfTitles';

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
 * @param name - What it is called.
 * @returns The row.
 */
const aFilm = (name: string) =>
  TitleRowSchema.parse({
    id: 'movie:1',
    key: 'movie:1',
    kind: 'film',
    libraryId: '00000000-0000-4000-8000-000000000002',
    lead: {
      id: '00000000-0000-4000-8000-000000000001',
      libraryId: '00000000-0000-4000-8000-000000000002',
      title: name,
      year: 2001,
      durationSeconds: 6000,
      width: 1920,
      height: 1080,
      videoCodec: 'h264',
      videoRange: 'SDR',
      addedAt: '2026-01-02T03:04:05.000Z',
      genres: ['Drama', 'War'],
      externalId: '1',
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
    folder: '/films/A film (2001)',
    leadPath: null,
    looks: LOOKS,
    problemFiles: { duplicate: [], unreadable: [] },
    isEdited: false,
  });

describe('csvOfTitles', () => {
  it('writes a heading row, then a row a title', () => {
    const [heading, row] = csvOfTitles([aFilm('A film')]).split('\r\n');

    expect(heading).toBe(
      'kind,title,sort_title,year,release_date,genres,rating,tmdb_id,matched,edited,seasons,episodes,files,size_bytes,added,folder',
    );
    expect(row).toBe(
      'film,A film,,2001,,Drama; War,,1,yes,no,,,1,100,2026-01-02,/films/A film (2001)',
    );
  });

  it('quotes a cell with a comma or a quote, and keeps a spreadsheet from running one as a formula', () => {
    const [, quoted] = csvOfTitles([aFilm('Say "hi", then')]).split('\r\n');
    const [, formula] = csvOfTitles([aFilm('=1+1')]).split('\r\n');

    expect(quoted).toContain('"Say ""hi"", then"');
    expect(formula).toContain(",'=1+1,");
  });
});
