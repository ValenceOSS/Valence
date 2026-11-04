import { describe, expect, it } from 'vitest';
import { gatherTitles } from './gatherTitles';
import { lengthOf } from './lengthOf';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

const episodeOf = (id: string, number: number) =>
  aMediaSummary({
    id,
    seriesId: 'show',
    seriesTitle: 'Show',
    seasonNumber: 1,
    episodeNumber: number,
    durationSeconds: 1800,
  });

describe('lengthOf', () => {
  it('adds up every episode of a series', () => {
    const [show] = gatherTitles([episodeOf('e1', 1), episodeOf('e2', 2)]);

    expect(show === undefined ? 0 : lengthOf(show)).toBe(3600);
  });

  it('is the main version’s length for a film held more than once', () => {
    const [film] = gatherTitles([
      aMediaSummary({ id: 'film', durationSeconds: 6000 }),
      aMediaSummary({ id: 'cut', parentId: 'film', versionLabel: 'Long', durationSeconds: 7000 }),
    ]);

    expect(film === undefined ? 0 : lengthOf(film)).toBe(6000);
  });
});
