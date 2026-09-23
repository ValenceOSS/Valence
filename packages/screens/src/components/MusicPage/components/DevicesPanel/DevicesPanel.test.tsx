import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { DevicesPanel, iconFor } from './DevicesPanel';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const PHONE = { clientId: 'phone', label: 'iPhone', nowPlaying: null };

beforeEach(() => {
  fake = aFakeMusicPlayer({ current: aTrack(1), isPlaying: true, positionSeconds: 12 });
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      '/api/music/devices': {
        devices: [{ clientId: 'client-1', label: 'This one', nowPlaying: null }, PHONE],
      },
    }),
  );
});

describe('DevicesPanel', () => {
  it('lists this person’s other devices, and not this one among them', async () => {
    renderInAnAddress(<DevicesPanel />);

    expect(await screen.findByRole('button', { name: 'Play on iPhone' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play on This one' })).not.toBeInTheDocument();
  });

  it('hands the music to another device', async () => {
    renderInAnAddress(<DevicesPanel />);

    await userEvent.click(await screen.findByRole('button', { name: 'Play on iPhone' }));

    expect(fake.player.playOn).toHaveBeenCalledWith({ clientId: 'phone', label: 'iPhone' });
  });

  it('takes the music back while controlling another device', async () => {
    fake = aFakeMusicPlayer({
      current: aTrack(1),
      remote: { clientId: 'phone', label: 'iPhone' },
    });

    renderInAnAddress(<DevicesPanel />);

    expect(screen.getByText('Controlling iPhone')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play here' }));

    expect(fake.player.playHere).toHaveBeenCalled();
  });

  it('says how to add a device where there are no others', async () => {
    vi.stubGlobal('fetch', answerMusicRequests());

    renderInAnAddress(<DevicesPanel />);

    expect(await screen.findByText(/Open Valence on another device/)).toBeInTheDocument();
  });

  it('draws a device by what it calls itself', () => {
    expect(iconFor('iPhone')).toBe(SmartphoneIcon);
    expect(iconFor('Living room TV')).toBe(MonitorIcon);
    expect(iconFor('MacBook Pro')).toBe(LaptopIcon);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DevicesPanel.displayName).toBe('DevicesPanel');
  });
});
