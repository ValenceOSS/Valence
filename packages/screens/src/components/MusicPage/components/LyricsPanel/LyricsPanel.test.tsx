import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LyricsPanel } from './LyricsPanel';

const seek = vi.fn();

type Answer = {
  player: { seek: (seconds: number) => void };
  shown: { title: string } | null;
  lyrics: { isSynced: boolean; lines: { atMs: number; text: string }[] } | null;
  isReading: boolean;
  at: number;
};

const lyrics = vi.hoisted(() => {
  const held: { current: Answer | null } = { current: null };

  return held;
});

vi.mock('@ValenceScreens/music/useSongLyrics', () => ({
  useSongLyrics: () => lyrics.current,
}));

const WORDS = {
  isSynced: true,
  lines: [
    { atMs: 1000, text: 'First line' },
    { atMs: 5000, text: 'Second line' },
  ],
};

const playing = (): Answer => ({
  player: { seek },
  shown: { title: 'Track 1' },
  lyrics: WORDS,
  isReading: false,
  at: 1,
});

beforeEach(() => {
  seek.mockReset();
  lyrics.current = playing();
});

describe('LyricsPanel', () => {
  it('shows the words of the song playing, the line being sung marked', () => {
    render(<LyricsPanel />);

    expect(screen.getByRole('region', { name: 'Lyrics for Track 1' })).toBeInTheDocument();
    expect(screen.getByText('Second line').closest('li')).toHaveAttribute('aria-current', 'true');
  });

  it('jumps to a synced line that is pressed', async () => {
    render(<LyricsPanel />);

    await userEvent.click(screen.getByText('First line'));

    expect(seek).toHaveBeenCalledWith(1);
  });

  it('says so while nothing is playing', () => {
    lyrics.current = { ...playing(), shown: null };

    render(<LyricsPanel />);

    expect(screen.getByText('Nothing is playing')).toBeInTheDocument();
  });

  it('holds a place while the words are being read', () => {
    lyrics.current = { ...playing(), isReading: true };

    render(<LyricsPanel />);

    expect(screen.getByLabelText('Loading lyrics')).toBeInTheDocument();
  });

  it('says plainly when no lyrics were found', () => {
    lyrics.current = { ...playing(), lyrics: null };

    render(<LyricsPanel />);

    expect(screen.getByText('No lyrics found')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LyricsPanel.displayName).toBe('LyricsPanel');
  });
});
