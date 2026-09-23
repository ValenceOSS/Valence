import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { startQueue } from '@ValenceClient/music/playQueue';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { QueuePanel } from './QueuePanel';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const TRACKS = [aTrack(1), aTrack(2), aTrack(3)];

const queued = () => {
  const queue = startQueue(TRACKS, 0, {
    source: { kind: 'album', id: 'a', name: 'Even In Arcadia' },
  });

  fake = aFakeMusicPlayer({ queue, current: TRACKS[0] ?? null });
};

describe('QueuePanel', () => {
  it('says nothing is queued where nothing is', () => {
    fake = aFakeMusicPlayer();

    render(<QueuePanel />);

    expect(screen.getByText('Nothing queued')).toBeInTheDocument();
  });

  it('shows what is playing and what comes after, and where it comes from', () => {
    queued();

    render(<QueuePanel />);

    expect(screen.getByRole('region', { name: 'Now playing' })).toHaveTextContent('Track 1');
    expect(screen.getByText('Next from Even In Arcadia')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('plays a song further down now', async () => {
    queued();

    render(<QueuePanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Play Track 3 now' }));

    expect(fake.player.jumpTo).toHaveBeenCalledWith(2);
  });

  it('takes a song out of the queue', async () => {
    queued();

    render(<QueuePanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Take Track 2 out of the queue' }));

    expect(fake.player.removeFromQueue).toHaveBeenCalledWith(1);
  });

  it('lists what comes next in the order it plays, each row one that can be dragged', () => {
    queued();

    render(<QueuePanel />);

    expect(screen.getAllByRole('listitem').map((row) => row.textContent ?? '')).toEqual([
      expect.stringContaining('Track 2'),
      expect.stringContaining('Track 3'),
    ]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(QueuePanel.displayName).toBe('QueuePanel');
  });
});
