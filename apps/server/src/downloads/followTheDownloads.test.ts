import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followTheDownloads } from './followTheDownloads';
import type { FollowedDownload } from './DownloadService';

const A_CHANGE: FollowedDownload = {
  profileId: 'a-profile',
  accountId: 'an-account',
  isNowReady: true,
  problem: null,
  download: {
    id: '9c858901-8a57-4791-81fe-4c455b099bc9',
    mediaId: '9c858901-8a57-4791-81fe-4c455b099bd0',
    seriesId: null,
    seriesTitle: null,
    title: 'Arrival',
    quality: 'original',
    audioLanguages: [],
    state: 'ready',
    progress: 1,
    bytesPerSecond: null,
    sizeBytes: 100,
    failure: null,
    secondsLeft: null,
    askedFrom: 'a-laptop',
    askedAt: '2026-09-25T00:00:00.000Z',
    readyAt: '2026-09-25T00:10:00.000Z',
  },
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('followTheDownloads', () => {
  it('asks round after round, and passes on what changed', async () => {
    const follow = vi.fn(() => Promise.resolve([A_CHANGE]));
    const onFollowed = vi.fn();
    const stop = followTheDownloads({ follow, onFollowed, everyMs: 1000 });

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);

    expect(follow).toHaveBeenCalledTimes(2);
    expect(onFollowed).toHaveBeenCalledWith([A_CHANGE]);
    stop();
  });

  it('says nothing when nothing changed', async () => {
    const onFollowed = vi.fn();
    const stop = followTheDownloads({
      follow: () => Promise.resolve([]),
      onFollowed,
      everyMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(onFollowed).not.toHaveBeenCalled();
    stop();
  });

  it('never runs two rounds at once, however slow one is', async () => {
    const round: { finish: () => void } = { finish: () => undefined };
    const follow = vi.fn(
      () =>
        new Promise<FollowedDownload[]>((resolve) => {
          round.finish = () => {
            resolve([]);
          };
        }),
    );
    const stop = followTheDownloads({ follow, onFollowed: vi.fn(), everyMs: 1000 });

    await vi.advanceTimersByTimeAsync(5000);
    expect(follow).toHaveBeenCalledTimes(1);

    round.finish();
    await vi.advanceTimersByTimeAsync(1000);
    expect(follow).toHaveBeenCalledTimes(2);
    stop();
  });

  it('carries on after a round that fails, and says so', async () => {
    const follow = vi
      .fn<() => Promise<FollowedDownload[]>>()
      .mockRejectedValueOnce(new Error('the database went away'))
      .mockResolvedValue([]);
    const onProblem = vi.fn();
    const stop = followTheDownloads({ follow, onFollowed: vi.fn(), onProblem, everyMs: 1000 });

    await vi.advanceTimersByTimeAsync(2000);

    expect(onProblem).toHaveBeenCalledWith('the database went away');
    expect(follow).toHaveBeenCalledTimes(2);
    stop();
  });

  it('stops when told', async () => {
    const follow = vi.fn(() => Promise.resolve([]));
    const stop = followTheDownloads({ follow, onFollowed: vi.fn(), everyMs: 1000 });

    stop();
    await vi.advanceTimersByTimeAsync(5000);

    expect(follow).not.toHaveBeenCalled();
  });
});
