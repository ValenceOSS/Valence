import { describe, expect, it } from 'vitest';
import { takeTurns } from './takeTurns';

describe('takeTurns', () => {
  it('carries straight on until the slice has run', async () => {
    let clock = 0;
    const turn = takeTurns(20, () => clock);
    const order: string[] = [];

    setImmediate(() => {
      order.push('waiting');
    });
    clock = 10;
    await turn();
    order.push('carried on');

    expect(order).toEqual(['carried on']);
  });

  it('lets what was waiting run once the slice has run', async () => {
    let clock = 0;
    const turn = takeTurns(20, () => clock);
    const order: string[] = [];

    setImmediate(() => {
      order.push('waiting');
    });
    clock = 25;
    await turn();
    order.push('carried on');

    expect(order).toEqual(['waiting', 'carried on']);
  });
});
