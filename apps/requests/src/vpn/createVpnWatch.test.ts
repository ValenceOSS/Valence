import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestsVpn } from '@ValenceContracts/schemas/Requests';
import { createVpnWatch } from './createVpnWatch';

/**
 * A VPN that is up or down, as asked.
 */
const aVpn = (isUp: boolean): RequestsVpn => ({
  isConfigured: true,
  isUp,
  publicAddress: isUp ? '203.0.113.7' : null,
  country: null,
  checkedAt: '2026-09-19T12:00:00.000Z',
  problem: isUp ? null : 'The tunnel is stopped',
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createVpnWatch', () => {
  it('knows nothing before it has asked', () => {
    const watch = createVpnWatch({ read: () => Promise.resolve(aVpn(true)), everyMs: 1000 });

    expect(watch.current().checkedAt).toBeNull();
  });

  it('asks as soon as it starts, and keeps the answer', async () => {
    const watch = createVpnWatch({ read: () => Promise.resolve(aVpn(true)), everyMs: 1000 });

    await watch.start();

    expect(watch.current()).toEqual(aVpn(true));

    watch.stop();
  });

  it('keeps asking, and says when the tunnel drops', async () => {
    const answers = [aVpn(true), aVpn(false)];
    const onChange = vi.fn();
    const watch = createVpnWatch({
      read: () => Promise.resolve(answers.shift() ?? aVpn(false)),
      everyMs: 1000,
      onChange,
    });

    await watch.start();
    await vi.advanceTimersByTimeAsync(1000);

    expect(watch.current().isUp).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(aVpn(false));

    watch.stop();
  });

  it('says nothing when the answer has not changed', async () => {
    const onChange = vi.fn();
    const watch = createVpnWatch({
      read: () => Promise.resolve(aVpn(true)),
      everyMs: 1000,
      onChange,
    });

    await watch.start();
    await vi.advanceTimersByTimeAsync(3000);

    expect(onChange).toHaveBeenCalledTimes(1);

    watch.stop();
  });

  it('stops asking once stopped, and can be stopped twice', async () => {
    const read = vi.fn(() => Promise.resolve(aVpn(true)));
    const watch = createVpnWatch({ read, everyMs: 1000 });

    await watch.start();
    watch.stop();
    watch.stop();
    await vi.advanceTimersByTimeAsync(3000);

    expect(read).toHaveBeenCalledTimes(1);
  });

  it('asks again on demand', async () => {
    const read = vi.fn(() => Promise.resolve(aVpn(true)));
    const watch = createVpnWatch({ read, everyMs: 1000 });

    expect(await watch.check()).toEqual(aVpn(true));
    expect(read).toHaveBeenCalledTimes(1);
  });
});
