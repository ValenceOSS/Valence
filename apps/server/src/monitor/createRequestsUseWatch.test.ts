import { describe, expect, it, vi } from 'vitest';
import { createRequestsUseWatch } from './createRequestsUseWatch';

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createRequestsUseWatch', () => {
  it('has nothing to say until the requests service has answered once', async () => {
    const watch = createRequestsUseWatch({ read: () => Promise.resolve(3_200_000_000) });

    expect(watch.current()).toBeNull();
    await settled();
    expect(watch.current()).toBe(3_200_000_000);
  });

  it('asks again only once the last answer is old enough', async () => {
    let clock = 0;
    const read = vi.fn(() => Promise.resolve(clock));
    const watch = createRequestsUseWatch({ read, everyMs: 10_000, now: () => clock });

    watch.current();
    await settled();
    clock = 9_999;
    watch.current();
    await settled();

    expect(read).toHaveBeenCalledTimes(1);

    clock = 10_000;
    watch.current();
    await settled();

    expect(read).toHaveBeenCalledTimes(2);
    expect(watch.current()).toBe(10_000);
  });

  it('never has two questions out at once, however often it is read', () => {
    let clock = 0;
    const read = vi.fn(() => new Promise<number | null>(() => {}));
    const watch = createRequestsUseWatch({ read, everyMs: 10, now: () => clock });

    watch.current();
    clock = 1_000_000;
    watch.current();

    expect(read).toHaveBeenCalledTimes(1);
  });

  it('forgets an old figure once the service stops answering, rather than showing it as current', async () => {
    let clock = 0;
    const answers = [() => Promise.resolve(3_000), () => Promise.reject(new Error('gone'))];
    const watch = createRequestsUseWatch({
      read: () => answers.shift()?.() ?? Promise.resolve(null),
      everyMs: 10,
      now: () => clock,
    });

    watch.current();
    await settled();
    expect(watch.current()).toBe(3_000);

    clock = 10;
    watch.current();
    await settled();

    expect(watch.current()).toBeNull();
  });
});
