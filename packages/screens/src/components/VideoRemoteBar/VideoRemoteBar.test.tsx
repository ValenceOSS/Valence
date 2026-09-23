import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoRemoteBar } from './VideoRemoteBar';
import type { VideoRemote as Remote } from '@ValenceClient/video/useVideoRemote';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const WATCHING: VideoNowWatching = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: 1,
};

const remote = vi.hoisted(() => {
  const send = vi.fn();
  const now: { current: Remote } = {
    current: { device: null, watching: null, positionSeconds: 0, send, release: () => {} },
  };

  return { send, now };
});

vi.mock('@ValenceClient/video/useVideoRemote', () => ({
  useVideoRemote: () => remote.now.current,
}));

const controlling = (watching: VideoNowWatching | null) => {
  remote.now.current = {
    device: { clientId: 'tv', label: 'Living room' },
    watching,
    positionSeconds: 0,
    send: remote.send,
    release: () => {},
  };
};

beforeEach(() => {
  remote.send.mockClear();
  remote.now.current = {
    device: null,
    watching: null,
    positionSeconds: 0,
    send: remote.send,
    release: () => {},
  };
});

describe('VideoRemoteBar', () => {
  it('draws nothing while this device controls nothing', () => {
    render(<VideoRemoteBar onOpen={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names the film and the television it is playing on', () => {
    controlling(WATCHING);
    render(<VideoRemoteBar onOpen={vi.fn()} />);

    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText('On Living room')).toBeInTheDocument();
  });

  it('opens the whole remote when pressed', async () => {
    const onOpen = vi.fn();

    controlling(WATCHING);
    render(<VideoRemoteBar onOpen={onOpen} />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Open the remote for Living room' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('pauses the film playing on the television', async () => {
    controlling(WATCHING);
    render(<VideoRemoteBar onOpen={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Pause' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'pause' });
  });

  it('plays a film paused on the television', async () => {
    controlling({ ...WATCHING, isPlaying: false });
    render(<VideoRemoteBar onOpen={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Play' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'resume' });
  });

  it('says it is starting, and offers no pause, until the television reports', () => {
    controlling(null);
    render(<VideoRemoteBar onOpen={vi.fn()} />);

    expect(screen.getByText('Starting…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  });
});
