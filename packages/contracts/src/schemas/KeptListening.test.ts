import { describe, expect, it } from 'vitest';
import {
  KEPT_LISTENING_KINDS,
  KeptListeningFileSchema,
  KeptListeningKindSchema,
  KeptListeningSchema,
  KeptListeningShelfSchema,
} from './KeptListening';

const A_TRACK = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Look To Windward',
  artists: [{ id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' }],
  album: { id: '00000000-0000-4000-8000-00000000a1b1', title: 'Take Me Back', hasArtwork: true },
  discNumber: null,
  trackNumber: 1,
  durationSeconds: 466,
  codec: 'flac',
  isLossless: true,
  bitDepth: 24,
  sampleRate: 44_100,
  bitrateKbps: 1400,
  hasLyrics: false,
  isFavourite: false,
};

const A_BOOK = {
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0b',
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Red Rising',
  layout: 'audio',
  direction: 'leftToRight',
  year: 2014,
  overview: null,
  genres: null,
  authors: ['Pierce Brown'],
  rating: null,
  chapterCount: 1,
  addedAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const A_CHAPTER = {
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0c01',
  bookId: A_BOOK.id,
  number: 1,
  title: 'Part 1',
  format: 'm4b',
  pageCount: null,
  addedAt: A_BOOK.addedAt,
};

const AN_ALBUM = {
  kind: 'album',
  id: '00000000-0000-4000-8000-00000000a1b1',
  title: 'Take Me Back',
  tracks: [A_TRACK],
  keptAt: '2026-10-01T00:00:00.000Z',
};

const A_FILE = {
  name: 'track-00000000-0000-4000-8000-000000000001-lossless.flac',
  from: '/api/music/tracks/00000000-0000-4000-8000-000000000001/stream?quality=lossless',
  state: 'fetching',
};

describe('KeptListeningKindSchema', () => {
  it('knows the four things music and audiobooks are kept as', () => {
    expect(KEPT_LISTENING_KINDS.map((kind) => KeptListeningKindSchema.parse(kind))).toEqual([
      'album',
      'playlist',
      'liked',
      'audiobook',
    ]);
  });

  it('refuses a kind of thing that is not kept', () => {
    expect(KeptListeningKindSchema.safeParse('film').success).toBe(false);
  });
});

describe('KeptListeningSchema', () => {
  it('accepts a kept album, filling in what it was not told', () => {
    expect(KeptListeningSchema.parse(AN_ALBUM)).toMatchObject({
      kind: 'album',
      byline: null,
      artworkFrom: null,
      quality: null,
      book: null,
      chapters: [],
      server: null,
      profileId: null,
    });
  });

  it('accepts a kept audiobook with its chapters', () => {
    const kept = KeptListeningSchema.parse({
      kind: 'audiobook',
      id: A_BOOK.id,
      title: A_BOOK.title,
      book: A_BOOK,
      chapters: [A_CHAPTER],
      keptAt: '2026-10-01T00:00:00.000Z',
    });

    expect(kept.book?.title).toBe('Red Rising');
    expect(kept.chapters).toHaveLength(1);
    expect(kept.tracks).toEqual([]);
  });

  it('refuses something kept with no name to list it by', () => {
    expect(KeptListeningSchema.safeParse({ ...AN_ALBUM, title: '' }).success).toBe(false);
  });

  it('refuses a time it was kept that is not a time', () => {
    expect(KeptListeningSchema.safeParse({ ...AN_ALBUM, keptAt: 'last week' }).success).toBe(false);
  });

  it('refuses a quality Valence does not offer', () => {
    expect(KeptListeningSchema.safeParse({ ...AN_ALBUM, quality: 'enormous' }).success).toBe(false);
  });
});

describe('KeptListeningFileSchema', () => {
  it('accepts a file on its way, starting it at nothing', () => {
    expect(KeptListeningFileSchema.parse(A_FILE)).toMatchObject({
      bytes: 0,
      ofBytes: null,
      failure: null,
    });
  });

  it('refuses a name that would climb out of the folder it is kept in', () => {
    expect(KeptListeningFileSchema.safeParse({ ...A_FILE, name: '../x' }).success).toBe(false);
  });

  it('refuses a name with a folder in it', () => {
    expect(
      KeptListeningFileSchema.safeParse({ ...A_FILE, name: 'music/track-1.flac' }).success,
    ).toBe(false);
  });

  it('refuses a name with capitals, which no kept file is given', () => {
    expect(KeptListeningFileSchema.safeParse({ ...A_FILE, name: 'Track-1.flac' }).success).toBe(
      false,
    );
  });

  it('refuses a file fetched from anywhere but the server in use', () => {
    expect(
      KeptListeningFileSchema.safeParse({ ...A_FILE, from: 'https://elsewhere.example/a.flac' })
        .success,
    ).toBe(false);
  });

  it('refuses a state a file cannot be in', () => {
    expect(KeptListeningFileSchema.safeParse({ ...A_FILE, state: 'lost' }).success).toBe(false);
  });

  it('refuses a size below nothing', () => {
    expect(KeptListeningFileSchema.safeParse({ ...A_FILE, bytes: -1 }).success).toBe(false);
  });
});

describe('KeptListeningShelfSchema', () => {
  it('reads an empty shelf from nothing at all', () => {
    expect(KeptListeningShelfSchema.parse({})).toEqual({ kept: [], files: [] });
  });

  it('reads a shelf of what is kept and its files', () => {
    const shelf = KeptListeningShelfSchema.parse({ kept: [AN_ALBUM], files: [A_FILE] });

    expect(shelf.kept[0]?.title).toBe('Take Me Back');
    expect(shelf.files[0]?.state).toBe('fetching');
  });
});
