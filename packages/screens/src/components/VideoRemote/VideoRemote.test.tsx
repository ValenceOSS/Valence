import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoRemote } from './VideoRemote';
import type { VideoRemote as Remote } from '@ValenceClient/video/useVideoRemote';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const WATCHING: VideoNowWatching = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: 'Season 1 · Episode 2',
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: 1,
};

const remote = vi.hoisted(() => {
  const send = vi.fn();
  const release = vi.fn();
  const now: { current: Remote } = {
    current: { device: null, watching: null, positionSeconds: 0, send, release },
  };

  return { send, release, now };
});

vi.mock('@ValenceClient/video/useVideoRemote', () => ({
  useVideoRemote: () => remote.now.current,
}));

const controlling = (watching: VideoNowWatching | null, positionSeconds = 120) => {
  remote.now.current = {
    device: { clientId: 'tv', label: 'Living room' },
    watching,
    positionSeconds,
    send: remote.send,
    release: remote.release,
  };
};

const draw = () => {
  const onClose = vi.fn();
  const onPlayHere = vi.fn();

  render(<VideoRemote isOpen onClose={onClose} onPlayHere={onPlayHere} />);

  return { onClose, onPlayHere };
};

beforeEach(() => {
  remote.send.mockClear();
  remote.release.mockClear();
  remote.now.current = {
    device: null,
    watching: null,
    positionSeconds: 0,
    send: remote.send,
    release: remote.release,
  };
});

describe('VideoRemote', () => {
  it('shows nothing while this device controls nothing', () => {
    draw();

    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
  });

  it('names the film and the television it is playing on', () => {
    controlling(WATCHING);
    draw();

    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText('Season 1 · Episode 2 · On Living room')).toBeInTheDocument();
  });

  it('waits for the television to start, with nothing to press but stop', () => {
    controlling(null);
    draw();

    expect(screen.getByText('Starting…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back 10 seconds' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Play here' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  });

  it('pauses a film that is playing', async () => {
    controlling(WATCHING);
    draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Pause' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'pause' });
  });

  it('plays a film that is paused', async () => {
    controlling({ ...WATCHING, isPlaying: false });
    draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Play' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'resume' });
  });

  it('goes back ten seconds and on thirty', async () => {
    controlling(WATCHING);
    draw();

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Back 10 seconds' }));
    await user.click(screen.getByRole('button', { name: 'On 30 seconds' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'skip', seconds: -10 });
    expect(remote.send).toHaveBeenCalledWith({ kind: 'skip', seconds: 30 });
  });

  it('shows how far through it is and how long is left', () => {
    controlling(WATCHING, 120);
    draw();

    expect(screen.getByRole('slider', { name: 'Where the film is up to' })).toHaveAttribute(
      'aria-valuenow',
      '120',
    );
    expect(screen.getByText('2:00')).toBeInTheDocument();
    expect(screen.getByText('-1:38:00')).toBeInTheDocument();
  });

  it('moves the film to where the bar is dragged', async () => {
    controlling(WATCHING, 120);
    draw();

    screen.getByRole('slider', { name: 'Where the film is up to' }).focus();
    await userEvent.setup().keyboard('{ArrowRight}');

    expect(remote.send).toHaveBeenCalledWith({ kind: 'seek', positionSeconds: 121 });
  });

  it('stops the film on the television and lets it go', async () => {
    controlling(WATCHING);

    const { onClose, onPlayHere } = draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'stop' });
    expect(remote.release).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onPlayHere).not.toHaveBeenCalled();
  });

  it('brings the film back here from where the television had got to', async () => {
    controlling(WATCHING, 754);

    const { onClose, onPlayHere } = draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Play here' }));

    expect(remote.send).toHaveBeenCalledWith({ kind: 'stop' });
    expect(remote.release).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onPlayHere).toHaveBeenCalledWith(WATCHING.mediaId, 754);
  });
});
