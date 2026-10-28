import { describe, expect, it } from 'vitest';
import { letOthersIn } from './letOthersIn';

describe('letOthersIn', () => {
  it('lets what was already waiting run first', async () => {
    const order: string[] = [];

    setTimeout(() => {
      order.push('waiting');
    }, 0);

    await letOthersIn();
    order.push('carried on');

    expect(order).toEqual(['waiting', 'carried on']);
  });
});
