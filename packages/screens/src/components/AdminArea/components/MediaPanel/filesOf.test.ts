import { describe, expect, it } from 'vitest';
import { filesOf } from './filesOf';
import { gatherTitles } from './gatherTitles';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

const FILM = aMediaSummary({ id: 'film', durationSeconds: 6000 });

const CUT = aMediaSummary({
  id: 'cut',
  parentId: 'film',
  versionLabel: 'Long',
  durationSeconds: 7000,
});

const episodeOf = (id: string, number: number) =>
  aMediaSummary({
    id,
    seriesId: 'show',
    seriesTitle: 'Show',
    seasonNumber: 1,
    episodeNumber: number,
  });

describe('filesOf', () => {
  it('is the file itself for a film held once', () => {
    const [film] = gatherTitles([FILM]);

    expect(film === undefined ? [] : filesOf(film).map((file) => file.id)).toEqual(['film']);
  });

  it('is every version of a film held more than once', () => {
    const [film] = gatherTitles([FILM, CUT]);

    expect(film === undefined ? [] : filesOf(film).map((file) => file.id)).toEqual(['film', 'cut']);
  });

  it('is every episode of a series', () => {
    const [show] = gatherTitles([episodeOf('e1', 1), episodeOf('e2', 2)]);

    expect(show === undefined ? [] : filesOf(show).map((file) => file.id)).toEqual(['e1', 'e2']);
  });
});
