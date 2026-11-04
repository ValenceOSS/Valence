import { describe, expect, it } from 'vitest';
import { aLiveTvStore } from '@ValenceServer/testing/aLiveTvStore';
import { aStoredLiveSource } from '@ValenceServer/testing/aStoredLiveSource';

describe('aLiveTvStore', () => {
  it('reads back only the source it holds', async () => {
    const source = aStoredLiveSource();
    const { store } = aLiveTvStore(source);

    await expect(store.readSource(source.id)).resolves.toBe(source);
    await expect(store.readSource('someone else')).resolves.toBeNull();
  });

  it('notes what is written to it', async () => {
    const { store, changes, channels } = aLiveTvStore(aStoredLiveSource());

    await store.changeSource('any', { name: 'Sport' });
    await store.replaceChannels('any', []);

    expect(changes).toEqual([{ name: 'Sport' }]);
    expect(channels).toEqual([[]]);
  });
});
