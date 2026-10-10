import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { countStillWanted } from './countStillWanted';

describe('countStillWanted', () => {
  it('counts the films, episodes and albums not in the library yet', () => {
    const film = aMediaRequest({ kind: 'film', items: [aRequestItem({ state: 'waiting' })] });
    const series = aMediaRequest({
      kind: 'series',
      items: [
        aRequestItem({ state: 'available' }),
        aRequestItem({ state: 'wanted' }),
        aRequestItem({ state: 'waiting' }),
      ],
    });
    const artist = aMediaRequest({
      kind: 'artist',
      items: [aRequestItem({ state: 'filed' }), aRequestItem({ state: 'wanted' })],
    });

    expect(countStillWanted([film, series, artist])).toEqual({ films: 1, episodes: 2, albums: 1 });
  });

  it('counts nothing where everything is here', () => {
    const held = aMediaRequest({ items: [aRequestItem({ state: 'available' })] });

    expect(countStillWanted([held])).toEqual({ films: 0, episodes: 0, albums: 0 });
  });
});
