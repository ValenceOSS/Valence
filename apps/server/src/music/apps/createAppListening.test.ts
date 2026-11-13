import { describe, expect, it, vi } from 'vitest';
import { A_MUSIC_TRACK_FOR_TEST } from '@ValenceServer/music/A_MUSIC_TRACK_FOR_TEST';
import { createAppListening } from './createAppListening';

const APP = {
  appPasswordId: 'pw1',
  accountId: 'account-1',
  profileId: 'p1',
  profileName: 'Sam',
  label: 'Feishin',
};

/**
 * App listening over a fake presence, fake devices and a clock the test moves, with each wait kept
 * so the test can run it.
 *
 * @returns The listening, its fakes, and how to move the clock and run what waits.
 */
const built = () => {
  let at = 1_000;
  const waits: { run: () => void; afterMs: number; cancelled: boolean }[] = [];
  const presence = { connect: vi.fn(() => true), disconnect: vi.fn() };
  const devices = { report: vi.fn(() => true) };
  const listening = createAppListening({
    presence,
    devices,
    now: () => at,
    later: (run, afterMs) => {
      const wait = { run, afterMs, cancelled: false };

      waits.push(wait);

      return () => {
        wait.cancelled = true;
      };
    },
  });

  return {
    listening,
    presence,
    devices,
    waits,
    tick: (ms: number) => {
      at += ms;
    },
  };
};

describe('createAppListening', () => {
  it('shows an app as one of the person’s devices, playing the song from the start', () => {
    const { listening, presence, devices } = built();

    listening.report(APP, A_MUSIC_TRACK_FOR_TEST);

    expect(presence.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'app~pw1',
        socketId: 'app~pw1',
        accountId: 'account-1',
        profileId: 'p1',
        profileName: 'Sam',
        deviceLabel: 'Feishin',
      }),
    );
    expect(devices.report).toHaveBeenCalledWith(
      { accountId: 'account-1', profileId: 'p1' },
      'app~pw1',
      expect.objectContaining({
        trackId: A_MUSIC_TRACK_FOR_TEST.id,
        title: 'First Light',
        artists: ['Mara Quill'],
        albumId: A_MUSIC_TRACK_FOR_TEST.album.id,
        positionSeconds: 0,
        durationSeconds: 240,
        isPlaying: true,
        quality: 'lossless',
        reportedAtMs: 1_000,
      }),
    );
  });

  it('connects once while an app keeps playing, and hears it at most once a second', () => {
    const { listening, presence, devices, tick } = built();

    listening.report(APP, A_MUSIC_TRACK_FOR_TEST);
    tick(200);
    listening.report(APP, A_MUSIC_TRACK_FOR_TEST);
    listening.report(APP, { ...A_MUSIC_TRACK_FOR_TEST, id: 'skipped-past' });
    tick(2_000);
    listening.report(APP, { ...A_MUSIC_TRACK_FOR_TEST, id: 'another' });

    expect(presence.connect).toHaveBeenCalledTimes(1);
    expect(devices.report).toHaveBeenCalledTimes(2);
  });

  it('goes once the song would have ended, a minute after, and waits again for each new song', () => {
    const { listening, presence, waits, tick } = built();

    listening.report(APP, A_MUSIC_TRACK_FOR_TEST);
    tick(5_000);
    listening.report(APP, { ...A_MUSIC_TRACK_FOR_TEST, id: 'another', durationSeconds: 100 });

    expect(waits.map((wait) => [wait.afterMs, wait.cancelled])).toEqual([
      [300_000, true],
      [160_000, false],
    ]);
    waits[1]?.run();
    expect(presence.disconnect).toHaveBeenCalledWith('app~pw1', 'app~pw1');
  });

  it('goes at once when the app says nothing is playing, and only if it was there', () => {
    const { listening, presence, waits } = built();

    listening.report(APP, null);
    expect(presence.disconnect).not.toHaveBeenCalled();

    listening.report(APP, A_MUSIC_TRACK_FOR_TEST);
    listening.report(APP, null);

    expect(presence.disconnect).toHaveBeenCalledTimes(1);
    expect(waits[0]?.cancelled).toBe(true);
  });

  it('keeps a long app name to sixty characters', () => {
    const { listening, presence } = built();

    listening.report({ ...APP, label: `  ${'x'.repeat(80)}` }, A_MUSIC_TRACK_FOR_TEST);

    expect(presence.connect).toHaveBeenCalledWith(
      expect.objectContaining({ deviceLabel: 'x'.repeat(60) }),
    );
  });

  it('waits on the real clock where none is given', () => {
    vi.useFakeTimers();

    const presence = { connect: vi.fn(() => true), disconnect: vi.fn() };
    const listening = createAppListening({ presence, devices: { report: vi.fn(() => true) } });

    listening.report(APP, A_MUSIC_TRACK_FOR_TEST);
    vi.advanceTimersByTime(299_000);
    expect(presence.disconnect).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(presence.disconnect).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
