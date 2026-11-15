import { describe, expect, it } from 'vitest';
import { recoverOrGiveUp } from '@ValenceClient/playback/recoverOrGiveUp';
import type { Recoveries } from '@ValenceClient/playback/recoverOrGiveUp';

const failAt = (recoveries: Recoveries, nowMs: number) => {
  const decided = recoverOrGiveUp(recoveries, nowMs);

  return decided.shouldRecover ? decided.recoveries : null;
};

describe('recoverOrGiveUp', () => {
  it('starts a stream that fails for the first time again', () => {
    expect(recoverOrGiveUp({}, 10_000)).toEqual({
      shouldRecover: true,
      recoveries: { firstAtMs: 10_000 },
    });
  });

  it('starts it again a second time where it fails again within three seconds', () => {
    expect(recoverOrGiveUp({ firstAtMs: 10_000 }, 12_000)).toEqual({
      shouldRecover: true,
      recoveries: { firstAtMs: 10_000, secondAtMs: 12_000 },
    });
  });

  it('gives up on a third failure within three seconds of both the first and the second', () => {
    expect(recoverOrGiveUp({ firstAtMs: 10_000, secondAtMs: 12_000 }, 12_500)).toEqual({
      shouldRecover: false,
    });
  });

  it('starts again every time a stream fails only now and then', () => {
    const once = failAt({}, 10_000);
    const twice = once === null ? null : failAt(once, 20_000);
    const thrice = twice === null ? null : failAt(twice, 30_000);

    expect(thrice).not.toBeNull();
  });

  it('starts again where the first recovery was long enough ago, however recent the second', () => {
    expect(recoverOrGiveUp({ firstAtMs: 10_000, secondAtMs: 11_000 }, 14_000)).toEqual({
      shouldRecover: true,
      recoveries: { firstAtMs: 14_000, secondAtMs: 11_000 },
    });
  });

  it('starts again where only the second recovery was long enough ago', () => {
    expect(recoverOrGiveUp({ firstAtMs: 13_000, secondAtMs: 11_000 }, 14_500)).toEqual({
      shouldRecover: true,
      recoveries: { firstAtMs: 13_000, secondAtMs: 14_500 },
    });
  });
});
