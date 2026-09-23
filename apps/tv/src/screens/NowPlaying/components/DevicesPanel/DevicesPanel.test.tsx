import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, userEvent } from '@testing-library/react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { DevicesPanel } from '@ValenceTv/screens/NowPlaying/components/DevicesPanel/DevicesPanel';
import { aFakeMusicPlayer } from '@ValenceTv/testing/aFakeMusicPlayer';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';
import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import type { MusicDevice, MusicNowPlaying } from '@ValenceContracts/schemas/MusicRemote';

const mockHeld: { player: MusicPlayer | null } = { player: null };

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => {
    if (mockHeld.player === null) {
      throw new Error('No player was set up for the test.');
    }

    return mockHeld.player;
  },
}));

const aPlayer = (start: Partial<MusicPlayerState> = {}) => {
  const { player } = aFakeMusicPlayer(start);

  mockHeld.player = player;

  return player;
};

const playing = (title: string, isPlaying: boolean): MusicNowPlaying => ({
  trackId: aTrack(9).id,
  title,
  artists: ['Sleep Token'],
  albumId: aTrack(9).album.id,
  hasArtwork: true,
  positionSeconds: 30,
  durationSeconds: 200,
  isPlaying,
  volume: 1,
  isMuted: false,
  quality: 'lossless',
  upNext: [],
  reportedAtMs: 0,
});

const THIS_TELEVISION: MusicDevice = {
  clientId: 'client-1',
  label: 'Living Room',
  nowPlaying: null,
};

const DEVICES: MusicDevice[] = [
  THIS_TELEVISION,
  { clientId: 'phone', label: 'Marques iPhone', nowPlaying: playing('Caramel', true) },
  { clientId: 'laptop', label: 'Studio MacBook', nowPlaying: null },
  { clientId: 'screen', label: 'Office', nowPlaying: playing('Emergence', false) },
];

const SHOWN: WhatIsPlaying = {
  trackId: aTrack(9).id,
  title: 'Caramel',
  artists: [{ id: null, name: 'Sleep Token' }],
  albumId: aTrack(9).album.id,
  albumTitle: null,
  hasArtwork: true,
  positionSeconds: 42,
  durationSeconds: 200,
  isPlaying: false,
  isLoading: false,
  volume: 1,
  remote: null,
};

const draw = (
  devices: MusicDevice[],
  onChosen = jest.fn(),
  shown: WhatIsPlaying | null = SHOWN,
) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(musicQueries.devices().queryKey, devices);

  return render(
    <QueryClientProvider client={cache}>
      <DevicesPanel shown={shown} onChosen={onChosen} />
    </QueryClientProvider>,
  );
};

describe('DevicesPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
  });

  it('lists this television as playing here, then every other device and what it is doing', async () => {
    aPlayer({ current: aTrack(1) });

    const drawn = await draw(DEVICES);

    expect(drawn.getByText('Play on')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'This Apple TV · playing here' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Marques iPhone · playing Caramel' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Studio MacBook · not playing' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Office · paused on Emergence' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: /Living Room/ })).toBeNull();
  });

  it('says how to add a device when there are no others', async () => {
    aPlayer();

    const drawn = await draw([THIS_TELEVISION]);

    expect(
      drawn.getByText('Open Valence on another device, signed in as you, and it will be here.'),
    ).toBeTruthy();
  });

  it('hands the music to the device chosen and closes', async () => {
    const player = aPlayer({ current: aTrack(1) });
    const onChosen = jest.fn();
    const drawn = await draw(DEVICES, onChosen);

    await userEvent.press(drawn.getByRole('button', { name: 'Studio MacBook · not playing' }));

    expect(player.playOn).toHaveBeenCalledWith({ clientId: 'laptop', label: 'Studio MacBook' });
    expect(onChosen).toHaveBeenCalledTimes(1);
  });

  it('takes control of a device already playing even with nothing playing here', async () => {
    const player = aPlayer();
    const drawn = await draw(DEVICES);

    await userEvent.press(drawn.getByRole('button', { name: 'Marques iPhone · playing Caramel' }));

    expect(player.playOn).toHaveBeenCalledWith({ clientId: 'phone', label: 'Marques iPhone' });
  });

  it('sends nothing to a quiet device when nothing is playing here, and still closes', async () => {
    const player = aPlayer();
    const onChosen = jest.fn();
    const drawn = await draw(DEVICES, onChosen);

    await userEvent.press(drawn.getByRole('button', { name: 'Studio MacBook · not playing' }));

    expect(player.playOn).not.toHaveBeenCalled();
    expect(onChosen).toHaveBeenCalledTimes(1);
  });

  it('only closes when this television, already playing, is chosen', async () => {
    const player = aPlayer({ current: aTrack(1) });
    const onChosen = jest.fn();
    const drawn = await draw(DEVICES, onChosen);

    await userEvent.press(drawn.getByRole('button', { name: 'This Apple TV · playing here' }));

    expect(player.playHere).not.toHaveBeenCalled();
    expect(onChosen).toHaveBeenCalledTimes(1);
  });

  describe('while controlling another device', () => {
    it('marks the device being controlled and leaves it be when chosen again', async () => {
      const player = aPlayer({ remote: { clientId: 'phone', label: 'Marques iPhone' } });
      const onChosen = jest.fn();
      const drawn = await draw(DEVICES, onChosen);

      await userEvent.press(drawn.getByRole('button', { name: 'Marques iPhone · controlling' }));

      expect(player.playOn).not.toHaveBeenCalled();
      expect(onChosen).toHaveBeenCalledTimes(1);
    });

    it('takes the music back from where the other had reached when this television is chosen', async () => {
      const player = aPlayer({ remote: { clientId: 'phone', label: 'Marques iPhone' } });
      const drawn = await draw(DEVICES);

      await userEvent.press(drawn.getByRole('button', { name: 'This Apple TV' }));

      expect(player.playHere).toHaveBeenCalledWith(42, false);
    });

    it('takes the music back from the start, playing, when nothing is known of where it was', async () => {
      const player = aPlayer({ remote: { clientId: 'phone', label: 'Marques iPhone' } });
      const drawn = await draw(DEVICES, jest.fn(), null);

      await userEvent.press(drawn.getByRole('button', { name: 'This Apple TV' }));

      expect(player.playHere).toHaveBeenCalledWith(0, true);
    });
  });
});
