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
      createdAt: '2026-09-19T00:00:00.000Z',
    });
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
});
