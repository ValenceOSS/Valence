import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchEpisodeOrders } from './fetchEpisodeOrders';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchEpisodeOrders', () => {
  it('reads the orders the catalogue has for a programme', async () => {
    const orders = { orders: [{ id: 'dvd', name: 'DVD', type: 3 }], chosen: null };

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(orders) })),
    );

    await expect(fetchEpisodeOrders('file')).resolves.toEqual(orders);
  });
});
