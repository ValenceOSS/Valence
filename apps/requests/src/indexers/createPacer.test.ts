import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPacer } from './createPacer';

afterEach(() => {
  vi.useRealTimers();
});

describe('createPacer', () => {
  it('never holds up an indexer with no limit', async () => {
    const sleep = vi.fn(() => Promise.resolve());
    const pacer = createPacer({ now: () => 0, sleep });

    await pacer.turn('a', null);
    await pacer.turn('a', null);

    expect(sleep).not.toHaveBeenCalled();
  });

  it('spaces calls to one indexer out to its limit', async () => {
    const sleep = vi.fn(() => Promise.resolve());
    const pacer = createPacer({ now: () => 0, sleep });

    await pacer.turn('a', 30);
    await pacer.turn('a', 30);
    await pacer.turn('a', 30);

    expect(sleep.mock.calls).toEqual([[2000], [4000]]);
  });

  it('keeps calls apart by the gap a site asks for, even with no limit of its own', async () => {
    const sleep = vi.fn(() => Promise.resolve());
    const pacer = createPacer({ now: () => 0, sleep });

    await Promise.all([
      pacer.turn('a', null, 2000),
      pacer.turn('a', null, 2000),
      pacer.turn('a', null, 2000),
    ]);

    expect(sleep.mock.calls).toEqual([[2000], [4000]]);
  });

  it('keeps to whichever is slower, the limit or the gap', async () => {
    const sleep = vi.fn(() => Promise.resolve());
    const pacer = createPacer({ now: () => 0, sleep });

    await pacer.turn('a', 60, 2000);
    await pacer.turn('a', 60, 2000);
    await pacer.turn('b', 10, 2000);
    await pacer.turn('b', 10, 2000);

    expect(sleep.mock.calls).toEqual([[2000], [6000]]);
  });

  it('lets an urgent turn go ahead of every one still waiting that is not', async () => {
    let clock = 0;
    const sleep = vi.fn((ms: number) => {
      clock += ms;

      return Promise.resolve();
    });
    const pacer = createPacer({ now: () => clock, sleep });
    const order: string[] = [];
    const take = (name: string, isUrgent = false) =>
      pacer.turn('a', null, 1000, isUrgent).then(() => {
        order.push(name);
      });

    await Promise.all([
      take('first'),
      take('background'),
      take('later background'),
      take('by hand', true),
      take('also by hand', true),
    ]);

    expect(order).toEqual(['first', 'by hand', 'also by hand', 'background', 'later background']);
  });

  it('keeps each indexer to its own turn', async () => {
    const sleep = vi.fn(() => Promise.resolve());
    const pacer = createPacer({ now: () => 0, sleep });

    await pacer.turn('a', 30);
    await pacer.turn('b', 30);

    expect(sleep).not.toHaveBeenCalled();
  });

  it('lets a call through at once when the last was long enough ago', async () => {
    let clock = 0;
    const sleep = vi.fn(() => Promise.resolve());
    const pacer = createPacer({ now: () => clock, sleep });

    await pacer.turn('a', 60);
    clock = 5000;
    await pacer.turn('a', 60);

    expect(sleep).not.toHaveBeenCalled();
  });

  it('waits on the real clock by default', async () => {
    vi.useFakeTimers();

    const pacer = createPacer();
    let isThrough = false;

    await pacer.turn('a', 60);
    void pacer.turn('a', 60).then(() => {
      isThrough = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(isThrough).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(isThrough).toBe(true);
  });
});
