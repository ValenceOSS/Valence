import { describe, expect, it } from 'vitest';
import { orderOf } from './orderOf';

describe('orderOf', () => {
  it('describes a file by the order chosen for its programme, and by the catalogue’s otherwise', () => {
    const orders = new Map([['100', 'dvd-order']]);

    expect(orderOf(orders, '100')).toEqual({ episodeOrder: 'dvd-order' });
    expect(orderOf(orders, '200')).toEqual({});
    expect(orderOf(orders, null)).toEqual({});
  });
});
