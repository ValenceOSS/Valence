import { renderHook } from '@testing-library/react-native';
import { useSystemNowPlaying } from '@ValenceTv/music/useSystemNowPlaying';

type Playing = {
  title: string;
  artists: { name: string }[];
  album: { title: string };
};

const mockState: { current: Playing | null; remote: { clientId: string } | null } = {
  current: null,
  remote: null,
};

const mockShow = jest.fn();

const mockClear = jest.fn();

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({ theMusicPlayer: () => ({}) }));

jest.mock('@ValenceClient/music/useMusicPlayer', () => ({
  useMusicPlayer: () => ({ state: { ...mockState } }),
}));

jest.mock('@ValenceTv/music/theTvsMusicAudio', () => ({
  theTvsMusicPlayer: () => ({
    setActiveForLockScreen: (...told: object[]) => {
      mockShow(...told);
    },
    clearLockScreenControls: () => {
      mockClear();
    },
  }),
}));

const SONG: Playing = {
  title: 'The Summoning',
  artists: [{ name: 'Sleep Token' }, { name: 'Vessel' }],
  album: { title: 'Take Me Back To Eden' },
};

beforeEach(() => {
  mockState.current = null;
  mockState.remote = null;
  mockShow.mockClear();
  mockClear.mockClear();
});

describe('useSystemNowPlaying', () => {
  it('tells the television what song is playing here', async () => {
    mockState.current = SONG;

    await renderHook(() => {
      useSystemNowPlaying();
    });

    expect(mockShow).toHaveBeenCalledWith(
      true,
      {
        title: 'The Summoning',
        artist: 'Sleep Token, Vessel',
        albumTitle: 'Take Me Back To Eden',
      },
      { showSeekBackward: true, showSeekForward: true },
    );
  });

  it('shows nothing while nothing plays', async () => {
    await renderHook(() => {
      useSystemNowPlaying();
    });

    expect(mockShow).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
  });

  it('shows nothing while this television is only a remote for another device', async () => {
    mockState.current = SONG;
    mockState.remote = { clientId: 'phone' };

    await renderHook(() => {
      useSystemNowPlaying();
    });

    expect(mockShow).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
  });

  it('forgets the song once the app stops listening', async () => {
    mockState.current = SONG;

    const { unmount } = await renderHook(() => {
      useSystemNowPlaying();
    });

    expect(mockClear).not.toHaveBeenCalled();

    await unmount();

    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it('tells the television again only when the song changes', async () => {
    mockState.current = SONG;

    const { rerender } = await renderHook(() => {
      useSystemNowPlaying();
    });

    await rerender(undefined);

    expect(mockShow).toHaveBeenCalledTimes(1);
  });
});
