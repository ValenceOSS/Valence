import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, userEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { NowPlaying } from '@ValenceTv/screens/NowPlaying/NowPlaying';
import { aFakeMusicPlayer } from '@ValenceTv/testing/aFakeMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';
import type { PlayQueue } from '@ValenceClient/music/playQueue';
import type { Lyrics } from '@ValenceContracts/schemas/Music';
import type { MusicDevice } from '@ValenceContracts/schemas/MusicRemote';

type Heard = (event: { eventType: string }) => void;

const mockHeld: { player: MusicPlayer | null } = { player: null };

const mockMenu: { back: (() => void) | null } = { back: null };

const mockRemote = new Set<Heard>();

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => {
    if (mockHeld.player === null) {
      throw new Error('No player was set up for the test.');
    }

    return mockHeld.player;
  },
}));

jest.mock('@ValenceTv/navigation/useMenuButton', () => ({
  useMenuButton: (back: (() => void) | null) => {
    mockMenu.back = back;
  },
}));

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (heard: Heard) => {
      mockRemote.add(heard);

      return {
        remove: () => {
          mockRemote.delete(heard);
        },
      };
    },
  },
}));

const aPlayer = (start: Partial<MusicPlayerState> = {}) => {
  const faked = aFakeMusicPlayer(start);

  mockHeld.player = faked.player;

  return {
    player: faked.player,
    set: (change: Partial<MusicPlayerState>) =>
      act(() => {
        faked.set(change);
      }),
  };
};

const SONG = aTrack(1, { title: 'Caramel', hasLyrics: true });

const QUEUE: PlayQueue = {
  tracks: [SONG, aTrack(2, { title: 'Emergence' }), aTrack(3, { title: 'Damocles' })],
  order: [0, 1, 2],
  at: 0,
  isShuffled: false,
  repeat: 'off',
  isOrdered: false,
  source: null,
};

const WORDS: Lyrics = {
  isSynced: true,
  lines: [
    { atMs: 1000, text: 'Sticky sweet' },
    { atMs: 3000, text: 'Caramel heart' },
  ],
};

const draw = (
  seed: { lyrics?: Lyrics | null; liked?: string[]; devices?: MusicDevice[] } = {},
  onEmpty = jest.fn(),
  onBack = jest.fn(),
) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(musicQueries.lyrics(SONG.id).queryKey, seed.lyrics ?? null);
  cache.setQueryData(viewingQueries.favourites(null).queryKey, seed.liked ?? []);
  cache.setQueryData(musicQueries.devices().queryKey, seed.devices ?? []);

  return render(
    <QueryClientProvider client={cache}>
      <NowPlaying onEmpty={onEmpty} onBack={onBack} />
    </QueryClientProvider>,
  );
};

const press = (eventType: string) =>
  act(() => {
    for (const heard of mockRemote) {
      heard({ eventType });
    }
  });

describe('NowPlaying', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
    mockMenu.back = null;
  });

  it('shows the song, who sings it, the album and how it is being heard', async () => {
    aPlayer({ current: SONG, queue: QUEUE, durationSeconds: 201 });

    const drawn = await draw();

    expect(drawn.getByText('Caramel')).toBeTruthy();
    expect(drawn.getByText('Sleep Token — Even In Arcadia')).toBeTruthy();
    expect(drawn.getByText('Lossless')).toBeTruthy();
    expect(drawn.getByText('24-bit · 44.1 kHz')).toBeTruthy();
  });

  it('names the encode rather than the file when a smaller quality is being sent', async () => {
    aPlayer({ current: SONG, queue: QUEUE, quality: 'high' });

    const drawn = await draw();

    expect(drawn.getByText('High')).toBeTruthy();
    expect(drawn.queryByText('24-bit · 44.1 kHz')).toBeNull();
  });

  it('tells the player what each control asks for', async () => {
    const { player } = aPlayer({ current: SONG, queue: QUEUE });
    const drawn = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Shuffle' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Repeat' }));

    const [, skipBack] = drawn.getAllByRole('button', { name: 'Back' });

    if (skipBack === undefined) {
      throw new Error('There was no button to go back a song.');
    }

    await userEvent.press(skipBack);

    expect(player.toggle).toHaveBeenCalledTimes(1);
    expect(player.next).toHaveBeenCalledTimes(1);
    expect(player.toggleShuffle).toHaveBeenCalledTimes(1);
    expect(player.cycleRepeat).toHaveBeenCalledTimes(1);
    expect(player.previous).toHaveBeenCalledTimes(1);
  });

  it('goes back with the button at the top left', async () => {
    aPlayer({ current: SONG, queue: QUEUE });

    const onBack = jest.fn();
    const drawn = await draw({}, jest.fn(), onBack);
    const [back] = drawn.getAllByRole('button', { name: 'Back' });

    if (back === undefined) {
      throw new Error('There was no Back button.');
    }

    await userEvent.press(back);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('says what shuffle and repeat are set to, and holds them off for a list that keeps its order', async () => {
    aPlayer({
      current: SONG,
      isPlaying: true,
      queue: { ...QUEUE, isShuffled: true, repeat: 'one', isOrdered: true },
    });

    const drawn = await draw();

    expect(drawn.getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Shuffle is on' })).toBeDisabled();
    expect(drawn.getByRole('button', { name: 'Repeating this song' })).toBeDisabled();
  });

  it('says when the whole list repeats', async () => {
    aPlayer({ current: SONG, queue: { ...QUEUE, repeat: 'all' } });

    const drawn = await draw();

    expect(drawn.getByRole('button', { name: 'Repeating' })).toBeTruthy();
  });

  it('likes the song, and says it is liked', async () => {
    aPlayer({ current: SONG, queue: QUEUE });

    const drawn = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Like Caramel' }));

    expect(drawn.getByRole('button', { name: 'Unlike Caramel' })).toBeTruthy();
  });

  it('shows the words beside the cover, the sung line lit', async () => {
    aPlayer({ current: SONG, queue: QUEUE, positionSeconds: 3.5 });

    const drawn = await draw({ lyrics: WORDS });

    expect(drawn.getByText('Caramel heart')).toHaveStyle({ opacity: 1 });
    expect(drawn.getByText('Sticky sweet')).toHaveStyle({ opacity: 0.4 });
  });

  it('goes to where a line is sung when it is pressed', async () => {
    const { player } = aPlayer({ current: SONG, queue: QUEUE });
    const drawn = await draw({ lyrics: WORDS });

    await userEvent.press(drawn.getByRole('button', { name: 'Caramel heart' }));

    expect(player.seek).toHaveBeenCalledWith(3);
  });

  it('hides the words and shows them again', async () => {
    aPlayer({ current: SONG, queue: QUEUE });

    const drawn = await draw({ lyrics: WORDS });

    await userEvent.press(drawn.getByRole('button', { name: 'Hide the words' }));

    expect(drawn.queryByText('Caramel heart')).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Show the words' }));

    expect(drawn.getByText('Caramel heart')).toBeTruthy();
  });

  it('holds off the words button for a song without any', async () => {
    aPlayer({ current: SONG, queue: QUEUE });

    const drawn = await draw();

    expect(drawn.getByRole('button', { name: 'Show the words' })).toBeDisabled();
  });

  it('lists what plays next, and plays the chosen song now', async () => {
    const { player } = aPlayer({ current: SONG, queue: QUEUE });
    const drawn = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Up next' }));

    expect(drawn.getByRole('button', { name: 'Emergence, Sleep Token' })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Damocles, Sleep Token' }));

    expect(player.jumpTo).toHaveBeenCalledWith(2);
    expect(drawn.queryByRole('button', { name: 'Damocles, Sleep Token' })).toBeNull();
  });

  it('closes a panel with Menu, and leaves Menu to go back once none is open', async () => {
    aPlayer({ current: SONG, queue: QUEUE });

    const drawn = await draw();

    expect(mockMenu.back).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Up next' }));

    expect(drawn.getByRole('button', { name: 'Emergence, Sleep Token' })).toBeTruthy();

    const close = mockMenu.back;

    if (close === null) {
      throw new Error('Menu was not held while the panel was open.');
    }

    await act(() => {
      close();
    });

    expect(drawn.queryByRole('button', { name: 'Emergence, Sleep Token' })).toBeNull();
    expect(mockMenu.back).toBeNull();
  });

  it('opens the devices to play on, and hands the music to the one chosen', async () => {
    const { player } = aPlayer({ current: SONG, queue: QUEUE });
    const drawn = await draw({
      devices: [{ clientId: 'phone', label: 'Marques iPhone', nowPlaying: null }],
    });

    await userEvent.press(drawn.getByRole('button', { name: 'Play on another device' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Marques iPhone · not playing' }));

    expect(player.playOn).toHaveBeenCalledWith({ clientId: 'phone', label: 'Marques iPhone' });
    expect(drawn.queryByText('Play on')).toBeNull();
  });

  it('shows what the device being controlled is playing, and not how this one would hear it', async () => {
    aPlayer({
      current: SONG,
      queue: QUEUE,
      remote: { clientId: 'phone', label: 'Marques iPhone' },
    });

    const drawn = await draw({
      devices: [
        {
          clientId: 'phone',
          label: 'Marques iPhone',
          nowPlaying: {
            trackId: aTrack(4).id,
            title: 'The Summoning',
            artists: ['Sleep Token'],
            albumId: aTrack(4).album.id,
            hasArtwork: false,
            positionSeconds: 30,
            durationSeconds: 400,
            isPlaying: false,
            volume: 1,
            isMuted: false,
            quality: 'lossless',
            upNext: [],
            reportedAtMs: 0,
          },
        },
      ],
    });

    expect(drawn.getByText('The Summoning')).toBeTruthy();
    expect(drawn.getByText('Playing on Marques iPhone')).toBeTruthy();
    expect(drawn.queryByText('Lossless')).toBeNull();
  });

  it('says when nothing is playing any more', async () => {
    const onEmpty = jest.fn();
    const { set } = aPlayer({ current: SONG, queue: QUEUE });

    await draw({}, onEmpty);

    expect(onEmpty).not.toHaveBeenCalled();

    await set({ current: null, queue: null });

    expect(onEmpty).toHaveBeenCalled();
  });

  describe('left alone while it plays', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const watchFades = () => jest.spyOn(Animated, 'timing');

    const fadesTo = (fades: ReturnType<typeof watchFades>, opacity: number) =>
      fades.mock.calls.some(([, config]) => config.toValue === opacity && config.duration === 500);

    it('fades the controls away after a few seconds, and back when the remote is touched', async () => {
      const fades = watchFades();

      aPlayer({ current: SONG, queue: QUEUE, isPlaying: true });
      await draw();

      await act(() => {
        jest.advanceTimersByTime(5900);
      });

      expect(fadesTo(fades, 0)).toBe(false);

      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(fadesTo(fades, 0)).toBe(true);

      fades.mockClear();
      await press('up');

      expect(fadesTo(fades, 1)).toBe(true);

      fades.mockRestore();
    });

    it('keeps the controls up while paused', async () => {
      const fades = watchFades();

      aPlayer({ current: SONG, queue: QUEUE, isPlaying: false });
      await draw();

      await act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(fadesTo(fades, 0)).toBe(false);

      fades.mockRestore();
    });
  });
});
