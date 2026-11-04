import { describe, expect, it } from 'vitest';
import { gatherTitles } from './gatherTitles';
import { isOneFile } from './isOneFile';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

describe('isOneFile', () => {
  it('is a film held once', () => {
    const [film] = gatherTitles([aMediaSummary({ id: 'film' })]);

    expect(film === undefined ? false : isOneFile(film)).toBe(true);
  });

  it('is not a film with versions beneath it, nor a series', () => {
    const [film] = gatherTitles([
      aMediaSummary({ id: 'film' }),
      aMediaSummary({ id: 'cut', parentId: 'film', versionLabel: 'Long' }),
    ]);
    const [show] = gatherTitles([
      aMediaSummary({
        id: 'e1',
        seriesId: 'show',
        seriesTitle: 'Show',
        seasonNumber: 1,
        episodeNumber: 1,
      }),
    ]);

    expect(film === undefined ? true : isOneFile(film)).toBe(false);
    expect(show === undefined ? true : isOneFile(show)).toBe(false);
  });
});
