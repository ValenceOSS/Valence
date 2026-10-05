import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { holdWatching } from './holdWatching';

const stopWatching = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('@ValenceClient/playback/startPlaybackSession', () => ({ stopWatching }));

beforeEach(() => {
  vi.useFakeTimers();
  stopWatching.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('holdWatching', () => {
  it('stops watching once the last player lets go', () => {
    const release = holdWatching('device-a');

    release();
    vi.runAllTimers();

    expect(stopWatching).toHaveBeenCalledExactlyOnceWith('device-a');
  });

  it('says nothing when another player opens as one closes, as a remount does', () => {
    const first = holdWatching('device-b');

    first();

    const second = holdWatching('device-b');

    vi.runAllTimers();

    expect(stopWatching).not.toHaveBeenCalled();

    second();
    vi.runAllTimers();

    expect(stopWatching).toHaveBeenCalledExactlyOnceWith('device-b');
  });

  it('leaves the choice to the last of several players to let go', () => {
    const first = holdWatching('device-d', () => true);
    const second = holdWatching('device-d', () => false);

    first();
    second();
    vi.runAllTimers();

    expect(stopWatching).not.toHaveBeenCalled();

    const third = holdWatching('device-d', () => false);
    const fourth = holdWatching('device-d', () => true);

    third();
    fourth();
    vi.runAllTimers();

    expect(stopWatching).toHaveBeenCalledExactlyOnceWith('device-d');
  });

  it('lets go once however often it is released, and not at all when told not to', () => {
    const release = holdWatching('device-c', () => false);

    release();
    release();
    vi.runAllTimers();

    expect(stopWatching).not.toHaveBeenCalled();
  });
});
