import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { controlDevice, readControlledDevice } from '@ValenceClient/video/controlledDevice';
import { PlayOnDialog } from './PlayOnDialog';
import type { VideoDevice } from '@ValenceContracts/schemas/VideoRemote';

const found = vi.hoisted(() => {
  const devices: VideoDevice[] = [];
  const wanted: boolean[] = [];

  return { devices, wanted };
});

vi.mock('@ValenceClient/video/useVideoDevices', () => ({
  useVideoDevices: (isWanted: boolean) => {
    found.wanted.push(isWanted);

    return found.devices;
  },
}));

const sent = vi.hoisted(() => ({ sendVideoCommand: vi.fn(() => Promise.resolve(true)) }));

vi.mock('@ValenceClient/video/videoDevices', () => sent);

const FILM = { id: '00000000-0000-4000-8000-000000000001', title: 'Arrival' };

const aDevice = (overrides: Partial<VideoDevice> = {}): VideoDevice => ({
  clientId: 'living-room',
  label: 'Living room',
  kind: 'tv',
  nowWatching: null,
  ...overrides,
});

beforeEach(() => {
  found.devices = [];
  found.wanted = [];
  sent.sendVideoCommand.mockClear();
});

afterEach(() => {
  controlDevice(null);
});

const draw = (media: typeof FILM | null = FILM) => {
  const onClose = vi.fn();
  const onSent = vi.fn();

  render(
    <PlayOnDialog media={media} startSeconds={754.8} onClose={onClose} onSent={onSent} />,
  );

  return { onClose, onSent };
};

describe('PlayOnDialog', () => {
  it('says how to bring a television into the list where none is open', () => {
    draw();

    expect(screen.getByText(/Open Valence on your Apple TV/)).toBeInTheDocument();
  });

  it('offers only televisions, not the other devices this person has open', () => {
    found.devices = [
      aDevice(),
      aDevice({ clientId: 'laptop', label: 'MacBook', kind: 'browser' }),
      aDevice({ clientId: 'old', label: 'Old tab', kind: null }),
    ];

    draw();

    expect(screen.getByRole('button', { name: 'Play on Living room' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play on MacBook' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play on Old tab' })).not.toBeInTheDocument();
  });

  it('says what each television is doing now', () => {
    found.devices = [
      aDevice(),
      aDevice({
        clientId: 'bedroom',
        label: 'Bedroom',
        nowWatching: {
          mediaId: '00000000-0000-4000-8000-000000000002',
          title: 'Dune',
          subtitle: null,
          hasBackdrop: false,
          positionSeconds: 10,
          durationSeconds: 9000,
          isPlaying: false,
          reportedAtMs: 1,
        },
      }),
    ];

    draw();

    expect(screen.getByText('Not playing anything')).toBeInTheDocument();
    expect(screen.getByText('Paused on Dune')).toBeInTheDocument();
  });

  it('starts the film on the television chosen, from the whole second it had got to', async () => {
    found.devices = [aDevice()];

    const { onSent } = draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Play on Living room' }));

    expect(sent.sendVideoCommand).toHaveBeenCalledWith('living-room', {
      kind: 'play',
      mediaId: FILM.id,
      startSeconds: 754,
    });
    expect(onSent).toHaveBeenCalledOnce();
  });

  it('makes this device the remote for the television it sent the film to', async () => {
    found.devices = [aDevice()];

    draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Play on Living room' }));

    expect(readControlledDevice()).toEqual({ clientId: 'living-room', label: 'Living room' });
  });

  it('asks for the devices only while it is open', () => {
    draw(null);

    expect(found.wanted).toContain(false);
    expect(found.wanted).not.toContain(true);
  });
});
