import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { OfflineMusicBar } from './OfflineMusicBar';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

beforeEach(() => {
  fake = aFakeMusicPlayer();
});

describe('OfflineMusicBar', () => {
  it('draws nothing while nothing is playing', () => {
    renderInAnAddress(<OfflineMusicBar />);

    expect(screen.queryByRole('button', { name: 'Stop and close' })).not.toBeInTheDocument();
  });

  it('names the song playing from what this device keeps', () => {
    fake = aFakeMusicPlayer({ current: aTrack(1), isPlaying: true });
    renderInAnAddress(<OfflineMusicBar />);

    expect(screen.getByText('Track 1')).toBeInTheDocument();
  });

  it('pauses a song that is playing', async () => {
    fake = aFakeMusicPlayer({ current: aTrack(1), isPlaying: true });
    renderInAnAddress(<OfflineMusicBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(fake.player.pause).toHaveBeenCalledOnce();
  });

  it('carries on with a song that is paused', async () => {
    fake = aFakeMusicPlayer({ current: aTrack(1), isPlaying: false });
    renderInAnAddress(<OfflineMusicBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(fake.player.resume).toHaveBeenCalledOnce();
  });

  it('stops the music when closed', async () => {
    fake = aFakeMusicPlayer({ current: aTrack(1), isPlaying: true });
    renderInAnAddress(<OfflineMusicBar />);

    await userEvent.click(screen.getByRole('button', { name: 'Stop and close' }));

    expect(fake.player.stop).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OfflineMusicBar.displayName).toBe('OfflineMusicBar');
  });
});
