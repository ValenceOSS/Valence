import { describe, expect, it } from 'vitest';
import { CatalogueTitleSchema, RequestProgressSchema } from './CatalogueTitle';

describe('CatalogueTitleSchema', () => {
  it('reads a title and where it stands', () => {
    expect(
      CatalogueTitleSchema.parse({
        kind: 'film',
        id: '438631',
        title: 'Dune',
        subtitle: null,
        year: 2021,
        overview: null,
        posterUrl: null,
        standing: { status: 'library', mediaId: 'm1', requestId: null, requestState: null },
      }).standing.status,
    ).toBe('library');
  });

  it('refuses a standing it does not know', () => {
    expect(() =>
      CatalogueTitleSchema.parse({
        kind: 'film',
        id: '1',
        title: 'Dune',
        subtitle: null,
        year: null,
        overview: null,
        posterUrl: null,
        standing: { status: 'wished', mediaId: null, requestId: null, requestState: null },
      }),
    ).toThrow();
  });
});

describe('RequestProgressSchema', () => {
  it('keeps progress between nothing and all of it', () => {
    expect(() =>
      RequestProgressSchema.parse({
        downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
        state: 'downloading',
        progress: 1.5,
        sizeBytes: null,
        doneBytes: null,
        downloadBytesPerSecond: null,
        secondsLeft: null,
      }),
    ).toThrow();
  });
});
