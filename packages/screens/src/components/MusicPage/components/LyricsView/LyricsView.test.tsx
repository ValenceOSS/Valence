import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { LyricsView } from './LyricsView';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const TRACK = aTrack(1, { hasLyrics: true });

const SYNCED = {
  isSynced: true,
  lines: [
    { atMs: 1000, text: 'If I tell you all my feelings' },
    { atMs: 5000, text: 'Would you believe me, yeah?' },
    { atMs: 9000, text: 'What if I told you' },
  ],
};

const serve = (
  lyrics: { isSynced: boolean; lines: { atMs: number | null; text: string }[] } | null,
) => {
  vi.stubGlobal(
    'fetch',
    answerMusicRequests(
      lyrics === null ? {} : { [`/api/music/tracks/${TRACK.id}/lyrics`]: lyrics },
    ),
  );
};

beforeEach(() => {
  fake = aFakeMusicPlayer({ current: TRACK, isPlaying: true, positionSeconds: 6 });
  serve(SYNCED);
});

describe('LyricsView', () => {
  it('says nothing is playing where nothing is', () => {
    fake = aFakeMusicPlayer();

    renderInAnAddress(<LyricsView />);

    expect(screen.getByText('Nothing is playing')).toBeInTheDocument();
  });

  it('shows every line of the song playing', async () => {
    renderInAnAddress(<LyricsView />);

    expect(await screen.findByRole('region', { name: 'Lyrics for Track 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks the line being sung', async () => {
    renderInAnAddress(<LyricsView />);

    const current = await screen.findByRole('button', { name: 'Would you believe me, yeah?' });

    expect(current.closest('li')).toHaveAttribute('aria-current', 'true');
  });

  it('goes to the point in the song where a line is sung', async () => {
    renderInAnAddress(<LyricsView />);

    await userEvent.click(await screen.findByRole('button', { name: 'What if I told you' }));

    expect(fake.player.seek).toHaveBeenCalledWith(9);
  });

  it('shows lyrics without times whole, following nothing', async () => {
    serve({ isSynced: false, lines: [{ atMs: null, text: 'Just words' }] });

    renderInAnAddress(<LyricsView />);

    expect(await screen.findByText('Just words')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Just words' })).not.toBeInTheDocument();
  });

  it('says where lyrics come from when a song has none', async () => {
    serve(null);

    renderInAnAddress(<LyricsView />);

    expect(await screen.findByText('No lyrics for Track 1')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LyricsView.displayName).toBe('LyricsView');
  });
});
