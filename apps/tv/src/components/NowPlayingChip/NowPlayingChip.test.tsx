import { createRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, userEvent } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { NowPlayingChip } from '@ValenceTv/components/NowPlayingChip/NowPlayingChip';
import { aFakeMusicPlayer } from '@ValenceTv/testing/aFakeMusicPlayer';
import type { ReactNode } from 'react';
import type { View } from 'react-native';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

const aPlayerDoing = (state: Partial<MusicPlayerState>): MusicPlayer =>
  aFakeMusicPlayer(state).player;

let mockPlayer = aPlayerDoing({});

jest.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => mockPlayer,
}));

jest.mock('@ValenceTv/music/listenToTheSound', () => ({
  listenToTheSound: () => () => undefined,
}));

const WithACache = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

WithACache.displayName = 'WithACache';

describe('NowPlayingChip', () => {
  it('draws nothing while nothing plays', async () => {
    mockPlayer = aPlayerDoing({});

    const drawn = await render(<NowPlayingChip onOpen={jest.fn()} />, { wrapper: WithACache });

    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('says what is playing and who sings it', async () => {
    mockPlayer = aPlayerDoing({
      current: aTrack(1, {
        title: 'Look To Windward',
        artists: [
          { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
          { id: '00000000-0000-4000-8000-00000000a7a8', name: 'Vessel' },
        ],
      }),
      isPlaying: true,
    });

    const drawn = await render(<NowPlayingChip onOpen={jest.fn()} />, { wrapper: WithACache });

    expect(drawn.getByRole('button', { name: 'Now playing: Look To Windward' })).toBeOnTheScreen();
    expect(drawn.getByText('Look To Windward')).toBeOnTheScreen();
    expect(drawn.getByText('Sleep Token, Vessel')).toBeOnTheScreen();
  });

  it('opens what is playing when chosen', async () => {
    mockPlayer = aPlayerDoing({ current: aTrack(1), isPlaying: false });
    const onOpen = jest.fn();

    const drawn = await render(<NowPlayingChip onOpen={onOpen} />, { wrapper: WithACache });

    await userEvent.press(drawn.getByRole('button', { name: 'Now playing: Track 1' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('hands itself over for the remote to be sent to it', async () => {
    mockPlayer = aPlayerDoing({ current: aTrack(1) });
    const ref = createRef<View>();

    await render(<NowPlayingChip onOpen={jest.fn()} ref={ref} />, { wrapper: WithACache });

    expect(ref.current).not.toBeNull();
  });
});
