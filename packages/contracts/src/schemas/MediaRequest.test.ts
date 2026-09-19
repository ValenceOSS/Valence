import { describe, expect, it } from 'vitest';
import {
  MediaRequestAskSchema,
  MediaRequestDraftSchema,
  RequestCatalogueSchema,
} from './MediaRequest';

describe('MediaRequestAskSchema', () => {
  it('asks for every season, and whatever comes later, unless told otherwise', () => {
    expect(MediaRequestAskSchema.parse({ kind: 'series', tmdbId: 1399 })).toEqual({
      kind: 'series',
      tmdbId: 1399,
      seasons: null,
      waitFor: 'digital',
    });
  });

  it('refuses something that is not a film or a series', () => {
    expect(() => MediaRequestAskSchema.parse({ kind: 'album', tmdbId: 1 })).toThrow();
  });
});

describe('RequestCatalogueSchema', () => {
  it('fills in what the catalogue did not say', () => {
    expect(RequestCatalogueSchema.parse({ title: 'Dune', year: 2021 })).toEqual({
      title: 'Dune',
      year: 2021,
      aliases: [],
      overview: null,
      posterUrl: null,
      runtimeMinutes: null,
      releaseDates: { theatrical: null, digital: null, physical: null },
      episodes: [],
      isEnded: false,
    });
  });

  it('refuses a date that is not a calendar date', () => {
    expect(() =>
      RequestCatalogueSchema.parse({
        title: 'Dune',
        year: 2021,
        releaseDates: { theatrical: '21 October', digital: null, physical: null },
      }),
    ).toThrow();
  });
});

describe('MediaRequestDraftSchema', () => {
  it('carries who asked, and whether it needs approving', () => {
    const draft = MediaRequestDraftSchema.parse({
      kind: 'film',
      tmdbId: 438631,
      libraryId: 'films',
      libraryPath: '/media/Films',
      requestedBy: { id: 'someone', name: 'Someone' },
      isApproved: false,
      catalogue: { title: 'Dune', year: 2021 },
    });

    expect(draft.isApproved).toBe(false);
    expect(draft.requestedBy.name).toBe('Someone');
  });
});
