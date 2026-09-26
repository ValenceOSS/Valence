import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { Reachability } from '@ValenceClient/platform/Platform.types';
import type { VideoPlayerProps } from '@ValenceScreens/components/VideoPlayer/VideoPlayer.types';
import { OfflineApp } from './OfflineApp';

vi.mock('@ValenceClient/session/auth', () => ({ signOut: vi.fn().mockResolvedValue(true) }));

vi.mock('@ValenceScreens/components/VideoPlayer/VideoPlayer', () => ({
  VideoPlayer: (props: VideoPlayerProps) => (
    <button type="button" onClick={props.onClose}>
      Stop playing {props.media.title}
    </button>
  ),
}));

const aFile = (over: Partial<HeldFile> = {}): HeldFile => ({
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'The Third Man',
  quality: 'original',
  durationSeconds: 5940,
  ofBytes: 1_073_741_824,
  state: 'here',
  bytes: 1_073_741_824,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-08-22T00:00:00.000Z',
  hasPoster: false,
  ...over,
});

const outOfReach: Reachability = {
  isReachable: () => false,
  whenChanged: () => () => {},
};

const asTheDesktopClient = () => {
  document.documentElement.dataset['valenceDesktop'] = 'true';
};

beforeEach(() => {
  installATestClient();
});

afterEach(() => {
  forgetPlatform();
  delete document.documentElement.dataset['valenceDesktop'];
});

describe('OfflineApp', () => {
  it('says which Valence this is, even with no server to ask', () => {
    render(<OfflineApp title="Kestrel" />);

    expect(screen.getByText('Kestrel')).toBeInTheDocument();
  });

  it('says it is offline', () => {
    render(<OfflineApp title="Valence" />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('says the server cannot be reached when that is why', () => {
    installATestClient({ reachability: outOfReach });

    render(<OfflineApp title="Valence" />);

    expect(screen.getByText(/Valence cannot be reached/)).toBeInTheDocument();
  });

  it('says it was asked for when the server is answering fine', () => {
    render(<OfflineApp title="Valence" />);

    expect(screen.getByText(/offline because you asked/)).toBeInTheDocument();
  });

  it('offers no way back while there is nothing to go back to', () => {
    installATestClient({ reachability: outOfReach });

    render(<OfflineApp title="Valence" />);

    expect(screen.queryByRole('button', { name: /online|Reconnect/ })).not.toBeInTheDocument();
  });

  it('offers the way back once the server is answering', () => {
    render(<OfflineApp title="Valence" />);

    expect(screen.getByRole('button', { name: /Reconnect|Go back online/ })).toBeInTheDocument();
  });

  it('shows what is on the disk', async () => {
    installATestClient({ held: aFakeHeldFiles([aFile()]).held });

    render(<OfflineApp title="Valence" />);

    await waitFor(() => {
      expect(screen.getByText('The Third Man')).toBeInTheDocument();
    });
  });

  it('offers no search, no account and no admin, because none of them exist here', async () => {
    installATestClient({ held: aFakeHeldFiles([aFile()]).held });

    render(<OfflineApp title="Valence" />);

    await waitFor(() => {
      expect(screen.getByText('The Third Man')).toBeInTheDocument();
    });

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Search|Account|Admin/ })).not.toBeInTheDocument();
  });

  it('plays one when it is chosen, and comes back again', async () => {
    installATestClient({ held: aFakeHeldFiles([aFile()]).held });

    render(<OfflineApp title="Valence" />);

    await userEvent.click(await screen.findByRole('button', { name: /^The Third Man/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop playing The Third Man' }));

    expect(screen.getByRole('heading', { name: 'On this device' })).toBeInTheDocument();
  });

  it('lets go of something without a server being involved', async () => {
    const files = aFakeHeldFiles([aFile()]);

    installATestClient({ held: files.held });

    render(<OfflineApp title="Valence" />);

    await waitFor(() => {
      expect(screen.getByText('The Third Man')).toBeInTheDocument();
    });

    const actor = userEvent.setup();

    await actor.click(screen.getByRole('button', { name: 'More for The Third Man' }));
    await actor.click(await screen.findByRole('menuitem', { name: /Delete from this device/ }));
    await actor.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(files.dropped).toEqual(['00000000-0000-4000-8000-000000000001']);
    });
  });

  it('offers a way out to somebody stranded, which is when there is nothing else to press', () => {
    asTheDesktopClient();
    installATestClient({ reachability: outOfReach });

    render(<OfflineApp title="Kestrel" />);

    expect(screen.getByRole('button', { name: /Change server/ })).toBeInTheDocument();
  });

  it('asks the window for a different server when that is pressed', async () => {
    asTheDesktopClient();
    installATestClient({ reachability: outOfReach });

    const asked = vi.fn();

    document.addEventListener('valence:change-server', asked);

    render(<OfflineApp title="Kestrel" />);

    await userEvent.click(screen.getByRole('button', { name: /Change server/ }));

    document.removeEventListener('valence:change-server', asked);

    expect(asked).toHaveBeenCalledTimes(1);
  });

  it('offers it in a browser to nobody, since a browser is already where it was opened', () => {
    installATestClient({ reachability: outOfReach });

    render(<OfflineApp title="Kestrel" />);

    expect(screen.queryByRole('button', { name: /Change server/ })).not.toBeInTheDocument();
  });

  it('still offers to go back online where the server is answering again', () => {
    asTheDesktopClient();

    render(<OfflineApp title="Kestrel" />);

    expect(screen.getByRole('button', { name: /Reconnect|Go back online/ })).toBeInTheDocument();
  });
});
