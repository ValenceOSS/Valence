import { act, render, screen, waitFor } from '@testing-library/react';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import type { Platform, Reachability } from '@ValenceClient/platform/Platform.types';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';
import type { WindowFrame } from '@ValenceContracts/schemas/WindowFrame';
import userEvent from '@testing-library/user-event';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import '@ValenceDesktop/TheWindow.types';

vi.mock('@ValenceScreens/routes/buildRouter', () => ({
  buildRouter: () => ({
    history: {
      location: { state: { __TSR_index: 0 } },
      subscribe: () => () => undefined,
      back: () => undefined,
      forward: () => undefined,
    },
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  RouterProvider: () => <div data-testid="the-application" />,
}));

const { Desktop } = await import('./Desktop');

const THE_ADDRESS = 'valence.server.address';

const aFilm = (): HeldFile => ({
  downloadId: '2b2b7f7e-2f0e-4a5e-9c2f-2b9b1e1f0a11',
  mediaId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  seriesId: null,
  seriesTitle: null,
  title: 'The Third Man',
  quality: 'original',
  durationSeconds: 5940,
  ofBytes: 100,
  state: 'here',
  bytes: 100,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-08-22T00:00:00.000Z',
  hasPoster: true,
  hasTrickplay: false,
});

const unreachable: Reachability = {
  isReachable: () => false,
  whenChanged: () => () => {},
};

const theWindowOffers = (found: string[], nearby: NearbyValence[] = []): void => {
  window.valence = {
    preferences: { held: {}, write: () => {}, forget: () => {} },
    goToTheServer: () => {},
    held: {
      all: () => Promise.resolve([]),
      keep: () => Promise.resolve(),
      drop: () => Promise.resolve(),
      pause: () => Promise.resolve(),
      whenChanged: () => () => {},
    },
    reach: { now: () => true, whenChanged: () => () => {} },
    update: {
      now: () => ({ kind: 'none' }),
      whenChanged: () => () => {},
      download: () => {},
    },
    about: {
      version: '1.2.0',
      commit: '2ae1bc1',
      arch: 'arm64',
      electron: '33.0.0',
      chrome: '130.0.0',
    },
    frame: {
      now: () => ({ isMaximised: false, isFullScreen: false }),
      whenChanged: () => () => {},
      minimise: () => {},
      maximise: () => {},
      close: () => {},
    },
    notifications: { setBadge: () => {} },
    passkeys: {
      way: 'page',
      ask: () => Promise.resolve({ kind: 'cancelled' }),
      make: () => Promise.resolve({ kind: 'cancelled' }),
      signInOnAPage: () => Promise.resolve({ kind: 'cancelled' }),
      addOneInTheBrowser: () => {},
    },
    servers: {
      alreadyFound: found,
      reach: () => Promise.resolve(true),
      whenFound: () => () => {},
      alreadyNearby: nearby,
      whenNearbyChanges: (listener) => {
        tellNearby = listener;

        return () => {
          tellNearby = () => undefined;
        };
      },
    },
  };
};

let tellNearby: (nearby: NearbyValence[]) => void = () => undefined;

const aClient = (
  overrides: Partial<Platform> = {},
  chosen: string | null = null,
  theme: string | null = null,
): void => {
  const platform = aFakePlatform(overrides);

  if (chosen !== null) {
    platform.store.write(THE_ADDRESS, chosen);
  }

  if (theme !== null) {
    platform.store.write('valence.theme', theme);
  }

  installPlatform(platform);
};

const asking = (): HTMLElement | null =>
  screen.queryByRole('heading', { name: 'Which Valence server do you use?' });

beforeEach(() => {
  theWindowOffers([]);
});

afterEach(() => {
  forgetPlatform();
  delete document.documentElement.dataset['theme'];
  delete document.documentElement.dataset['valencePlatform'];
});

describe('Desktop', () => {
  it('asks which Valence is yours on a fresh install, offering the one on this machine', async () => {
    theWindowOffers(['http://localhost:8420']);
    aClient();

    render(<Desktop />, { wrapper: CacheScope });

    expect(asking()).not.toBeNull();
    expect(screen.getByRole('button', { name: 'localhost:8420' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('the-application')).toBeNull();
    });
  });

  it('offers a server heard on the network, including one heard after the screen was drawn', async () => {
    theWindowOffers([], [{ address: 'http://192.168.1.224:8420', name: 'Valence on media-box' }]);
    aClient();

    render(<Desktop />, { wrapper: CacheScope });

    expect(screen.getByRole('button', { name: /Valence on media-box/u })).toBeInTheDocument();

    act(() => {
      tellNearby([{ address: 'http://192.168.1.30:8420', name: 'Valence on attic' }]);
    });

    expect(await screen.findByRole('button', { name: /Valence on attic/u })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Valence on media-box/u })).toBeNull();
  });

  it('offers the servers this client was pointed at before', () => {
    aClient();
    rememberServerAddress('https://demo.getvalence.app');
    rememberServerAddress(null);

    render(<Desktop />, { wrapper: CacheScope });

    expect(screen.getByRole('button', { name: 'demo.getvalence.app' })).toBeInTheDocument();
  });

  it('names this build at the foot of the screen that asks', () => {
    aClient({
      buildInfo: () => ({
        version: '1.2.0',
        commit: '2ae1bc1',
        runsOn: 'arm64 · Electron 33.0.0 · Chromium 130.0.0',
      }),
    });

    render(<Desktop />, { wrapper: CacheScope });

    expect(
      screen.getByText('Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0'),
    ).toBeInTheDocument();
  });

  it('asks for an address where nothing was found on this machine', () => {
    aClient();

    render(<Desktop />, { wrapper: CacheScope });

    expect(asking()).not.toBeNull();
    expect(screen.queryByText('Found on this machine')).toBeNull();
    expect(screen.getByLabelText('Server address')).toBeInTheDocument();
  });

  it('asks on a fresh install even where nothing is answering, rather than drawing an empty shelf', async () => {
    aClient({ reachability: unreachable });

    render(<Desktop />, { wrapper: CacheScope });

    await waitFor(() => {
      expect(asking()).not.toBeNull();
    });

    expect(screen.queryByTestId('the-application')).toBeNull();
  });

  it('draws the application once a server has been chosen and is answering', async () => {
    aClient({}, 'http://valence.example');

    render(<Desktop />, { wrapper: CacheScope });

    await waitFor(() => {
      expect(screen.getByTestId('the-application')).toBeInTheDocument();
    });

    expect(asking()).toBeNull();
  });

  it('offers a release found before this screen had mounted to hear about it', async () => {
    aClient({}, 'http://valence.example');
    window.valence.update.now = () => ({ kind: 'available', version: '1.2.0' });

    render(<Desktop />, { wrapper: CacheScope });

    expect(await screen.findByRole('heading', { name: 'Update Valence?' })).toBeInTheDocument();
  });

  it('asks whether to update, and fetches the release on yes', async () => {
    aClient({}, 'http://valence.example');
    const download = vi.fn();
    window.valence.update.now = () => ({ kind: 'available', version: '1.2.0' });
    window.valence.update.download = download;

    render(<Desktop />, { wrapper: CacheScope });

    expect(await screen.findByRole('heading', { name: 'Update Valence?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(download).toHaveBeenCalledOnce();
  });

  it('does not ask again about a version somebody put off', async () => {
    aClient({}, 'http://valence.example');
    window.valence.update.now = () => ({ kind: 'available', version: '1.2.0' });

    const { unmount } = render(<Desktop />, { wrapper: CacheScope });

    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    unmount();
    render(<Desktop />, { wrapper: CacheScope });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Update to 1.2.0' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: 'Update Valence?' })).not.toBeInTheDocument();
  });

  it('holds the question while a film has the window', async () => {
    aClient({}, 'http://valence.example');
    document.documentElement.dataset['valenceWatching'] = 'shown';
    window.valence.update.now = () => ({ kind: 'available', version: '1.2.0' });

    try {
      render(<Desktop />, { wrapper: CacheScope });

      await screen.findByRole('button', { name: 'Update to 1.2.0' });

      expect(screen.queryByRole('heading', { name: 'Update Valence?' })).not.toBeInTheDocument();

      act(() => {
        delete document.documentElement.dataset['valenceWatching'];
      });

      expect(await screen.findByRole('heading', { name: 'Update Valence?' })).toBeInTheDocument();
    } finally {
      delete document.documentElement.dataset['valenceWatching'];
    }
  });

  it('follows a download the window was told about after it opened', async () => {
    aClient({}, 'http://valence.example');
    let tell: (update: DesktopUpdate) => void = () => undefined;
    window.valence.update.whenChanged = (listener) => {
      tell = listener;

      return () => undefined;
    };

    render(<Desktop />, { wrapper: CacheScope });

    act(() => {
      tell({ kind: 'downloading', version: '1.2.0', percent: 45 });
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Updating 45%');
  });

  it('asks again where the chosen server stopped answering and nothing is on this device', async () => {
    aClient({ reachability: unreachable }, 'http://valence.example');

    render(<Desktop />, { wrapper: CacheScope });

    await waitFor(() => {
      expect(asking()).not.toBeNull();
    });

    expect(screen.getByDisplayValue('http://valence.example')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Couldn’t reach Valence at http://valence.example. Check that the server is running.',
      ),
    ).toBeInTheDocument();
  });

  it('draws the screen it owns in the theme somebody chose, not the one the machine prefers', () => {
    aClient({}, null, 'dark');

    render(<Desktop />, { wrapper: CacheScope });

    expect([asking() === null, document.documentElement.dataset['theme']]).toEqual([false, 'dark']);
  });

  it('leaves somebody with downloads in offline mode rather than asking them again', async () => {
    aClient(
      { reachability: unreachable, held: aFakeHeldFiles([aFilm()]).held },
      'http://valence.example',
    );

    render(<Desktop />, { wrapper: CacheScope });

    await waitFor(() => {
      expect(screen.getByTestId('the-application')).toBeInTheDocument();
    });

    expect(asking()).toBeNull();
  });

  it('draws minimise, maximise and close on Windows, and closes the window from them with nothing the bridge would have to copy', async () => {
    document.documentElement.dataset['valencePlatform'] = 'win32';
    const close = vi.fn();
    window.valence.frame.close = close;
    aClient();

    render(<Desktop />, { wrapper: CacheScope });

    expect(screen.getByRole('button', { name: 'Minimise' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maximise' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(close.mock.calls).toEqual([[]]);
  });

  it('leaves them to macOS, which draws its own traffic lights', () => {
    document.documentElement.dataset['valencePlatform'] = 'darwin';
    aClient();

    render(<Desktop />, { wrapper: CacheScope });

    expect(screen.queryByRole('button', { name: 'Minimise' })).not.toBeInTheDocument();
  });

  it('turns maximise into restore as the window is maximised, and takes them away in full screen', () => {
    document.documentElement.dataset['valencePlatform'] = 'win32';
    let tell: (frame: WindowFrame) => void = () => undefined;
    window.valence.frame.whenChanged = (listener) => {
      tell = listener;

      return () => undefined;
    };
    aClient();

    render(<Desktop />, { wrapper: CacheScope });

    act(() => {
      tell({ isMaximised: true, isFullScreen: false });
    });

    expect(screen.getByRole('button', { name: 'Restore down' })).toBeInTheDocument();

    act(() => {
      tell({ isMaximised: true, isFullScreen: true });
    });

    expect(screen.queryByRole('button', { name: 'Minimise' })).not.toBeInTheDocument();
  });
});
