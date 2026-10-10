import { describe, expect, it } from 'vitest';
import { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import { recordFromDraft } from './recordFromDraft';

const DRAFT = {
  kind: 'series' as const,
  tmdbId: 95396,
  libraryId: 'series',
  libraryPath: '/media/Series',
  seasons: [1],
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: true,
  catalogue: { title: 'Severance', year: 2022 },
};

describe('recordFromDraft', () => {
  it('keeps what was asked, approved where the asker may be', () => {
    expect(
      recordFromDraft(MediaRequestDraftSchema.parse(DRAFT), 'id', '2026-09-19T00:00:00.000Z'),
    ).toMatchObject({
      id: 'id',
      title: 'Severance',
      approval: 'approved',
      seasons: [1],
      requestedByName: 'Someone',
      alsoAskedBy: [],
      createdAt: '2026-09-19T00:00:00.000Z',
      tvdbId: null,
      handOff: null,
      handOffId: null,
    });
  });

  it('keeps the app it is handed to, and the TVDB id Sonarr knows it by', () => {
    const handOff = {
      appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
      rootFolderPath: '/tv',
      qualityProfileId: 4,
      metadataProfileId: null,
      searchesOnAdd: true,
    };

    expect(
      recordFromDraft(
        MediaRequestDraftSchema.parse({
          ...DRAFT,
          handOff,
          catalogue: { ...DRAFT.catalogue, tvdbId: 371_980 },
        }),
        'id',
        '2026-09-19T00:00:00.000Z',
      ),
    ).toMatchObject({ handOff, tvdbId: 371_980, handOffId: null });
  });

  it('waits on approval, and names no seasons for a film', () => {
    expect(
      recordFromDraft(
        MediaRequestDraftSchema.parse({ ...DRAFT, kind: 'film', isApproved: false }),
        'id',
        '2026-09-19T00:00:00.000Z',
      ),
    ).toMatchObject({ approval: 'awaiting', seasons: null });
  });

  it('keeps the Open Library id of a book, and names no seasons or releases for it', () => {
    expect(
      recordFromDraft(
        MediaRequestDraftSchema.parse({
          kind: 'book',
          openLibraryId: 21_277_329,
          libraryId: 'books',
          libraryPath: '/media/Books',
          requestedBy: { id: 'someone', name: 'Someone' },
          isApproved: true,
          catalogue: { title: 'Project Hail Mary', year: 2021, artist: 'Andy Weir' },
        }),
        'id',
        '2026-09-19T00:00:00.000Z',
      ),
    ).toMatchObject({
      kind: 'book',
      openLibraryId: 21_277_329,
      tmdbId: null,
      musicBrainzId: null,
      seasons: null,
      releaseTypes: null,
      artistName: 'Andy Weir',
    });
  });

  it('keeps whether anybody asked, as asked unless it is only followed', () => {
    const at = '2026-09-19T00:00:00.000Z';

    expect(recordFromDraft(MediaRequestDraftSchema.parse(DRAFT), 'id', at).origin).toBe('asked');
    expect(
      recordFromDraft(MediaRequestDraftSchema.parse({ ...DRAFT, origin: 'monitored' }), 'id', at)
        .origin,
    ).toBe('monitored');
  });

  it('keeps the item a film the library already holds is there as', () => {
    const film = MediaRequestDraftSchema.parse({
      ...DRAFT,
      kind: 'film',
      seasons: null,
      held: { mediaId: 'film-in-the-library' },
    });

    expect(recordFromDraft(film, 'id', '2026-09-19T00:00:00.000Z').mediaId).toBe(
      'film-in-the-library',
    );
  });
});
