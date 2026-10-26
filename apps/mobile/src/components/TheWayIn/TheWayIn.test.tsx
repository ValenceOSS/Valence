import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import { forgetTheKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { keptAlready } from '@ValenceMobile/testing/keptAlready';
import { TheWayIn } from './TheWayIn';
import type { ReactNode } from 'react';
import type { WayIn } from '@ValenceClient/profiles/fetchWayIn';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const A_FACE: WayIn['profiles'][number] = {
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const answering = (body: WayIn, ok = true) => {
  globalThis.fetch = jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(body), { status: ok ? 200 : 500 })),
    );
};

beforeEach(() => {
  forgetTheKeptListening();
  installPlatform(aFakePlatform({ serverAddress: () => 'http://192.168.1.36:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('TheWayIn', () => {
  it('asks who is watching', async () => {
    answering({ profiles: [], splashscreen: null, message: null });

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    expect(drawn.getByText('Who’s watching?')).toBeTruthy();
  });

  it('draws a face for everybody who lives here', async () => {
    answering({ profiles: [A_FACE], splashscreen: null, message: null });

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Dan')).toBeTruthy();
    });
  });

  it('says so where the server did not answer, rather than showing nobody', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('unreachable'));

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText(/^Can’t reach /)).toBeTruthy();
    });
  });

  it('offers a way to point this phone somewhere else', async () => {
    answering({ profiles: [], splashscreen: null, message: null });

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    expect(drawn.getByText('Use a different server')).toBeTruthy();
  });

  it('tells whoever is listening whose face was picked', async () => {
    answering({ profiles: [A_FACE], splashscreen: null, message: null });

    const onPicked = jest.fn();
    const drawn = await render(
      around(
        <TheWayIn
          onPicked={onPicked}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Sign in as Dan')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Sign in as Dan'));

    expect(onPicked).toHaveBeenCalledWith(A_FACE, expect.anything());
  });

  it('offers a passkey without picking a face first', async () => {
    answering({ profiles: [], splashscreen: null, message: null });

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    expect(drawn.getByRole('button', { name: 'Sign in with a passkey' })).toBeTruthy();
  });

  it('offers the downloads where the server did not answer and the phone keeps only music', async () => {
    const platform = aFakePlatform({
      serverAddress: () => 'http://192.168.1.36:8420',
      listeningFiles: aFakeListeningFiles().files,
    });

    installPlatform(platform);
    keptAlready(platform.store, [
      keptListeningOf({
        kind: 'album',
        detail: { album: anAlbum(), tracks: [aTrack(1)] },
        quality: 'high',
      }),
    ]);
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('unreachable'));
    const onDownloads = jest.fn();

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={onDownloads}
        />,
      ),
    );

    await userEvent.press(await drawn.findByRole('button', { name: 'Watch downloads' }));

    expect(onDownloads).toHaveBeenCalled();
  });

  it('offers no downloads where the music the phone keeps has not arrived yet', async () => {
    const platform = aFakePlatform({
      serverAddress: () => 'http://192.168.1.36:8420',
      listeningFiles: aFakeListeningFiles().files,
    });

    installPlatform(platform);
    keptAlready(
      platform.store,
      [
        keptListeningOf({
          kind: 'album',
          detail: { album: anAlbum(), tracks: [aTrack(1)] },
          quality: 'high',
        }),
      ],
      'paused',
    );
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('unreachable'));

    const drawn = await render(
      around(
        <TheWayIn
          onPicked={jest.fn()}
          onIn={jest.fn()}
          onElsewhere={jest.fn()}
          onDownloads={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText(/^Can’t reach /)).toBeTruthy();
    });
    expect(drawn.queryByRole('button', { name: 'Watch downloads' })).toBeNull();
  });
});
