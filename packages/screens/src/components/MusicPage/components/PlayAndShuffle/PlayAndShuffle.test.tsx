import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { PlayAndShuffle } from './PlayAndShuffle';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const SOURCE = { kind: 'tracks', id: 'mix', name: 'Mix' } as const;

beforeEach(() => {
  fake = aFakeMusicPlayer();
});

describe('PlayAndShuffle', () => {
  it('plays the list from its first track', async () => {
    const play = vi.spyOn(fake.player, 'play');

    render(
      <PlayAndShuffle
        tracks={[aTrack(1), aTrack(2)]}
        source={SOURCE}
        playLabel="Play"
        shuffleLabel="Shuffle"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(play).toHaveBeenCalledWith(
      expect.any(Array),
      0,
      expect.objectContaining({ source: SOURCE }),
    );
  });

  it('waits while there is nothing to play', () => {
    render(<PlayAndShuffle tracks={[]} source={SOURCE} playLabel="Play" shuffleLabel="Shuffle" />);

    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Shuffle' })).toBeDisabled();
  });

  it('leaves nothing to shuffle in a list meant to be heard in order', () => {
    render(
      <PlayAndShuffle
        tracks={[aTrack(1)]}
        source={SOURCE}
        playLabel="Play"
        shuffleLabel="Shuffle"
        isOrdered
      />,
    );

    expect(screen.getByRole('button', { name: 'Shuffle' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlayAndShuffle.displayName).toBe('PlayAndShuffle');
  });
});
