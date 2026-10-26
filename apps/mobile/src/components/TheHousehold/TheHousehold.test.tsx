import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchSession } from '@ValenceClient/session/auth';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import { forgetTheKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { keptAlready } from '@ValenceMobile/testing/keptAlready';
import { TheHousehold } from './TheHousehold';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/session/auth');
jest.mock('@ValenceClient/library/fetchLibrary');

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

const A_SESSION = {
  id: 'MllMpJgdqC9rKsdlZjN23KwuRYubAfQF',
  name: 'Dan',
  email: 'dan@getvalence.app',
  emailVerified: true,
};

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/**
 * A phone that cannot reach its server, holding only some music or an audiobook.
 *
 * @param kept - The music or audiobook it holds.
 */
const offlineHolding = (kept: Parameters<typeof keptListeningOf>[0]): void => {
  const platform = aFakePlatform({
    serverAddress: () => 'http://one.local:8420',
    listeningFiles: aFakeListeningFiles().files,
  });

  installPlatform(platform);
  keptAlready(platform.store, [keptListeningOf(kept)]);
  jest.mocked(fetchSession).mockResolvedValue(null);
  globalThis.fetch = jest.fn().mockRejectedValue(new Error('unreachable'));
};

beforeEach(() => {
  forgetTheKeptListening();
  mockFake = aFakeAudiobookPlayer();
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(fetchSession).mockReset();
  jest.mocked(fetchLibraries).mockReset().mockResolvedValue([]);
  jest.mocked(fetchLibraryItems).mockReset().mockResolvedValue({ items: [], total: 0 });
  globalThis.fetch = jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ profiles: [], splashscreen: null }))),
    );
});

afterEach(() => {
  forgetPlatform();
});

describe('TheHousehold', () => {
  it('shows the way in where nobody is signed in', async () => {
    jest.mocked(fetchSession).mockResolvedValue(null);

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Who’s watching?')).toBeTruthy();
    });
  });

  it('shows what is behind it where somebody is', async () => {
    jest.mocked(fetchSession).mockResolvedValue(A_SESSION);

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('What to show')).toBeTruthy();
    });
  });

  it('asks the server rather than remembering, so a session ended elsewhere shows the faces', async () => {
    jest.mocked(fetchSession).mockResolvedValue(null);

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.queryByLabelText('What to show')).toBeNull();
      expect(drawn.getByText('Who’s watching?')).toBeTruthy();
    });
  });

  it('opens the music player on music played from the downloads while the server is away', async () => {
    offlineHolding({
      kind: 'album',
      detail: { album: anAlbum(), tracks: [aTrack(1), aTrack(2)] },
      quality: 'high',
    });

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await userEvent.press(await drawn.findByRole('button', { name: 'Watch downloads' }));
    await userEvent.press(await drawn.findByRole('button', { name: 'Play Even In Arcadia' }));

    expect(await drawn.findByText('Track 1')).toBeTruthy();
  });

  it('opens the audiobook player on an audiobook played from the downloads while the server is away', async () => {
    offlineHolding({ kind: 'audiobook', detail: anAudiobook() });

    const drawn = await render(around(<TheHousehold onElsewhere={jest.fn()} />));

    await userEvent.press(await drawn.findByRole('button', { name: 'Watch downloads' }));
    await userEvent.press(await drawn.findByRole('button', { name: 'Play Red Rising' }));

    expect(await drawn.findByText('Red Rising · Pierce Brown')).toBeTruthy();
  });
});
