import { Alert } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchArtistStory } from '@ValenceClient/music/fetchMusic';
import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { useMayRequest } from '@ValenceClient/requests/useMayRequest';
import { AnArtistStory } from './AnArtistStory';
import type { ReactNode } from 'react';
import type { ArtistStory } from '@ValenceContracts/schemas/ArtistStory';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchArtistStory: jest.fn(),
}));

jest.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  ...jest.requireActual<object>('@ValenceClient/requests/fetchMediaRequests'),
  askForMedia: jest.fn(),
}));

jest.mock('@ValenceClient/requests/useMayRequest');

const GROUP = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const STORY: ArtistStory = {
  bio: 'Sleep Token are an English band formed in London in 2016.',
  sourceUrl: null,
  missing: [
    { releaseGroupId: GROUP, title: 'Sundowning', type: 'album', year: 2019, coverUrl: '/c/1' },
  ],
};

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(fetchArtistStory).mockResolvedValue(STORY);
  jest.mocked(useMayRequest).mockReturnValue(true);
});

afterEach(() => {
  forgetPlatform();
});

describe('AnArtistStory', () => {
  it('tells the artist’s story, a few lines at first and the whole of it on asking', async () => {
    const drawn = await render(around(<AnArtistStory artistId="a" name="Sleep Token" />));

    expect(await drawn.findByText(STORY.bio ?? '')).toBeTruthy();
    expect(drawn.getByText('From Wikipedia')).toBeTruthy();

    await userEvent.press(drawn.getByText('Read more'));

    expect(drawn.getByText('Read less')).toBeTruthy();
  });

  it('offers the albums the library does not have, and asks for one once somebody says so', async () => {
    jest.mocked(askForMedia).mockResolvedValue({ value: null, refusal: null });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
      buttons?.find((button) => button.text === 'Request')?.onPress?.();
    });
    const drawn = await render(around(<AnArtistStory artistId="a" name="Sleep Token" />));

    expect(await drawn.findByText('More from Sleep Token')).toBeTruthy();
    expect(drawn.getByText('2019 · Album')).toBeTruthy();

    await userEvent.press(drawn.getByText('Sundowning'));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'album',
        musicBrainzId: GROUP,
        seasons: null,
        isPickedByHand: false,
      });
    });
    expect(alert).toHaveBeenLastCalledWith('That could not be requested.');
  });

  it('offers nothing to request to somebody who may not ask for things', async () => {
    jest.mocked(useMayRequest).mockReturnValue(false);
    const drawn = await render(around(<AnArtistStory artistId="a" name="Sleep Token" />));

    expect(await drawn.findByText('From Wikipedia')).toBeTruthy();
    expect(drawn.queryByText('More from Sleep Token')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnArtistStory.displayName).toBe('AnArtistStory');
  });
});
