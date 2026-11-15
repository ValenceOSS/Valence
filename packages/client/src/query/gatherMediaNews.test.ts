import { describe, expect, it } from 'vitest';
import { gatherMediaNews } from '@ValenceClient/query/gatherMediaNews';
import type { RealtimeEvent } from '@ValenceContracts/schemas/Realtime';

/**
 * A media event saying something.
 *
 * @param payload - What it says.
 * @param folded - How many events the server folded into it.
 * @returns The event.
 */
const anEvent = (payload: RealtimeEvent['payload'], folded = 0): RealtimeEvent => ({
  kind: 'event',
  topic: 'media',
  atMs: 0,
  folded,
  payload,
});

describe('gatherMediaNews', () => {
  it('gathers the titles whose artwork and details changed', () => {
    const artwork = gatherMediaNews(null, anEvent({ event: 'artwork', mediaIds: ['one'] }));
    const metadata = gatherMediaNews(
      artwork,
      anEvent({ event: 'metadata', mediaIds: ['two', 'three'] }),
    );
    const changed = gatherMediaNews(metadata, anEvent({ event: 'changed', mediaId: 'four' }));

    expect(changed.isEverything).toBe(false);
    expect([...changed.artwork]).toEqual(['one']);
    expect([...changed.changed]).toEqual(['two', 'three', 'four']);
  });

  it('notes the collections and the likeness of titles changing', () => {
    const news = gatherMediaNews(
      gatherMediaNews(null, anEvent({ event: 'collections' })),
      anEvent({ event: 'likeness' }),
    );

    expect(news.isCollections).toBe(true);
    expect(news.isLikeness).toBe(true);
    expect(news.isEverything).toBe(false);
  });

  it('takes an event that names nothing as everything having changed', () => {
    expect(gatherMediaNews(null, anEvent({ added: 3 })).isEverything).toBe(true);
    expect(gatherMediaNews(null, anEvent(null)).isEverything).toBe(true);
    expect(gatherMediaNews(null, anEvent({ event: 'artwork', mediaIds: [] })).isEverything).toBe(
      true,
    );
  });

  it('takes several events folded into one as everything having changed', () => {
    expect(
      gatherMediaNews(null, anEvent({ event: 'artwork', mediaIds: ['one'] }, 2)).isEverything,
    ).toBe(true);
  });

  it('stays at everything once anything said so', () => {
    const everything = gatherMediaNews(null, anEvent({ added: 1 }));

    expect(
      gatherMediaNews(everything, anEvent({ event: 'artwork', mediaIds: ['one'] })).isEverything,
    ).toBe(true);
  });
});
