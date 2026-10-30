import { act, renderHook } from '@testing-library/react-native';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { reportNowWatching } from '@ValenceClient/video/videoDevices';
import { useRemoteControlled } from '@ValenceTv/playback/useRemoteControlled';
import type { PresenceEvent } from '@ValenceClient/presence/PresenceEventSchema';

jest.mock('@ValenceClient/video/videoDevices', () => ({
  reportNowWatching: jest.fn(() => Promise.resolve(true)),
}));

const MEDIA = '00000000-0000-4000-8000-000000000001';

const aPlayer = (position = 100) => ({
  mediaId: MEDIA,
  title: 'Dune',
  subtitle: null,
  hasBackdrop: true,
  isPlaying: true,
  hasNext: true,
  settings: [],
  skip: null,
  stepsBy: null,
  canStepOn: false,
  canStepBack: false,
  read: () => ({ position, duration: 9000 }),
  onPause: jest.fn(),
  onResume: jest.fn(),
  onSeek: jest.fn(),
  onNext: jest.fn(),
  onStep: jest.fn(),
  onChoose: jest.fn(),
  onStop: jest.fn(),
});

const told = (event: PresenceEvent): void => {
  emitPresenceEvent(event);
};

const fromAPhone = (command: Extract<PresenceEvent, { kind: 'video' }>['command']): void => {
  told({ kind: 'video', command, fromClientId: 'phone', fromLabel: 'Phone' });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(reportNowWatching).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useRemoteControlled', () => {
  it('says what is playing straight away, and every few seconds', async () => {
    await renderHook(() => {
      useRemoteControlled(aPlayer());
    });

    expect(reportNowWatching).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaId: MEDIA,
        title: 'Dune',
        positionSeconds: 100,
        durationSeconds: 9000,
        isPlaying: true,
        hasNext: true,
        settings: [],
        skip: null,
        stepsBy: null,
        canStepOn: false,
        canStepBack: false,
      }),
    );

    const before = jest.mocked(reportNowWatching).mock.calls.length;

    jest.advanceTimersByTime(10_000);

    expect(jest.mocked(reportNowWatching).mock.calls.length).toBe(before + 1);
  });

  it('never says a position below the start', async () => {
    await renderHook(() => {
      useRemoteControlled({ ...aPlayer(), read: () => ({ position: -3, duration: Number.NaN }) });
    });

    expect(reportNowWatching).toHaveBeenCalledWith(expect.objectContaining({ positionSeconds: 0 }));
  });

  it('pauses, resumes, moves and stops for another device', async () => {
    const player = aPlayer();

    await renderHook(() => {
      useRemoteControlled(player);
    });

    fromAPhone({ kind: 'pause' });
    fromAPhone({ kind: 'resume' });
    fromAPhone({ kind: 'seek', positionSeconds: 300 });
    fromAPhone({ kind: 'skip', seconds: 30 });
    fromAPhone({ kind: 'skip', seconds: -3600 });
    fromAPhone({ kind: 'stop' });

    expect(player.onPause).toHaveBeenCalledTimes(1);
    expect(player.onResume).toHaveBeenCalledTimes(1);
    expect(player.onSeek.mock.calls).toEqual([[300], [130], [0]]);
    expect(player.onStop).toHaveBeenCalledTimes(1);
  });

  it('goes on to the next episode for another device', async () => {
    const player = aPlayer();

    await renderHook(() => {
      useRemoteControlled(player);
    });

    fromAPhone({ kind: 'next' });

    expect(player.onNext).toHaveBeenCalledTimes(1);
    expect(player.onStop).not.toHaveBeenCalled();
  });

  it('says so again when whether an episode follows changes', async () => {
    const { rerender } = await renderHook(
      ({ hasNext }: { hasNext: boolean }) => {
        useRemoteControlled({ ...aPlayer(), hasNext });
      },
      { initialProps: { hasNext: false } },
    );

    await rerender({ hasNext: true });

    expect(reportNowWatching).toHaveBeenLastCalledWith(expect.objectContaining({ hasNext: true }));
  });

  it('steps back or on for another device', async () => {
    const player = aPlayer();

    await renderHook(() => {
      useRemoteControlled(player);
    });

    fromAPhone({ kind: 'step', toward: 'back' });
    fromAPhone({ kind: 'step', toward: 'on' });

    expect(jest.mocked(player.onStep).mock.calls).toEqual([['back'], ['on']]);
  });

  it('chooses subtitles, sound, quality or speed for another device', async () => {
    const player = aPlayer();

    await renderHook(() => {
      useRemoteControlled(player);
    });

    fromAPhone({ kind: 'choose', setting: 'subtitles', choiceId: 'eng-1' });

    expect(player.onChoose).toHaveBeenCalledWith('subtitles', 'eng-1');
  });

  it('says so again when what can be chosen or skipped changes', async () => {
    const subtitles = {
      setting: 'subtitles' as const,
      chosen: 'off',
      choices: [{ id: 'off', label: 'Off' }],
    };
    const { rerender } = await renderHook(
      ({ chosen, skip }: { chosen: string; skip: { label: string; toSeconds: number } | null }) => {
        useRemoteControlled({ ...aPlayer(), settings: [{ ...subtitles, chosen }], skip });
      },
      { initialProps: { chosen: 'off', skip: null } },
    );

    await rerender({ chosen: 'eng-1', skip: null });

    expect(reportNowWatching).toHaveBeenLastCalledWith(
      expect.objectContaining({ settings: [{ ...subtitles, chosen: 'eng-1' }] }),
    );

    await rerender({ chosen: 'eng-1', skip: { label: 'Skip Intro', toSeconds: 90 } });

    expect(reportNowWatching).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: { label: 'Skip Intro', toSeconds: 90 } }),
    );
  });

  it('says where it has got to once a command settles', async () => {
    await renderHook(() => {
      useRemoteControlled(aPlayer());
    });

    const before = jest.mocked(reportNowWatching).mock.calls.length;

    fromAPhone({ kind: 'seek', positionSeconds: 300 });
    jest.advanceTimersByTime(400);

    expect(jest.mocked(reportNowWatching).mock.calls.length).toBe(before + 1);
  });

  it('obeys an administrator’s stop, pause and resume', async () => {
    const player = aPlayer();

    await renderHook(() => {
      useRemoteControlled(player);
    });

    told({ kind: 'paused', reason: 'Maintenance' });
    told({ kind: 'resumed' });
    told({ kind: 'stopped', reason: 'Maintenance' });

    expect(player.onPause).toHaveBeenCalledTimes(1);
    expect(player.onResume).toHaveBeenCalledTimes(1);
    expect(player.onStop).toHaveBeenCalledTimes(1);
  });

  it('ignores what is not meant for the player', async () => {
    const player = aPlayer();

    await renderHook(() => {
      useRemoteControlled(player);
    });

    told({ kind: 'message', text: 'Hello' });
    fromAPhone({
      kind: 'play',
      mediaId: MEDIA,
      startSeconds: 0,
      subtitleLanguage: null,
      audioLanguage: null,
    });

    expect(player.onPause).not.toHaveBeenCalled();
    expect(player.onSeek).not.toHaveBeenCalled();
    expect(player.onStop).not.toHaveBeenCalled();
  });

  it('says so again whenever it pauses or plays', async () => {
    const { rerender } = await renderHook(
      ({ isPlaying }: { isPlaying: boolean }) => {
        useRemoteControlled({ ...aPlayer(), isPlaying });
      },
      { initialProps: { isPlaying: true } },
    );

    await rerender({ isPlaying: false });

    expect(reportNowWatching).toHaveBeenLastCalledWith(
      expect.objectContaining({ isPlaying: false }),
    );
  });

  it('says it has stopped and obeys nobody once the player closes', async () => {
    const player = aPlayer();
    const { unmount } = await renderHook(() => {
      useRemoteControlled(player);
    });

    await unmount();
    await act(() => {
      fromAPhone({ kind: 'pause' });
    });

    expect(reportNowWatching).not.toHaveBeenLastCalledWith(null);

    jest.advanceTimersByTime(1_500);

    expect(reportNowWatching).toHaveBeenLastCalledWith(null);
    expect(player.onPause).not.toHaveBeenCalled();
  });

  it('never says it stopped when the next episode’s player takes over straight away', async () => {
    const first = await renderHook(() => {
      useRemoteControlled(aPlayer());
    });

    await first.unmount();
    await renderHook(() => {
      useRemoteControlled({ ...aPlayer(), mediaId: '00000000-0000-4000-8000-000000000002' });
    });
    jest.advanceTimersByTime(3_000);

    expect(reportNowWatching).not.toHaveBeenCalledWith(null);
  });

  it('says nothing more once its player has closed, so the next episode’s word stands', async () => {
    const player = aPlayer();
    const { unmount } = await renderHook(() => {
      useRemoteControlled(player);
    });

    fromAPhone({ kind: 'step', toward: 'on' });
    jest.mocked(reportNowWatching).mockClear();
    await unmount();
    jest.advanceTimersByTime(400);

    expect(reportNowWatching).not.toHaveBeenCalled();
  });
});
