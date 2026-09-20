import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { setMusicPanel } from '@ValenceScreens/music/musicPanel';
import { MusicPage } from './MusicPage';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => aFakeMusicPlayer().player,
}));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({
      '/api/music/albums': { albums: [] },
      '/api/music/artists': { artists: [] },
      '/api/music/liked': { tracks: [] },
    }),
  );
});

afterEach(() => {
  setMusicPanel(null);
});

describe('MusicPage', () => {
  it('opens on the front page of the section, with the library beside it', async () => {
    renderInAnAddress(<MusicPage />);

    expect(await screen.findByText('No music yet')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Your library' })).toBeInTheDocument();
  });

  it('opens a page from the library', async () => {
    renderInAnAddress(<MusicPage />);

    await userEvent.click(await screen.findByRole('button', { name: /Liked Songs/ }));

    expect(await screen.findByRole('heading', { name: 'Liked Songs' })).toBeInTheDocument();
  });

  it('shows the queue beside the page when asked, and closes it', async () => {
    renderInAnAddress(<MusicPage />);

    act(() => {
      setMusicPanel('queue');
    });

    expect(await screen.findByRole('complementary', { name: 'Queue' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close queue' }));

    expect(screen.queryByRole('complementary', { name: 'Queue' })).not.toBeInTheDocument();
  });

  it('shows the devices beside the page when asked', async () => {
    renderInAnAddress(<MusicPage />);

    act(() => {
      setMusicPanel('devices');
    });

    expect(
      await screen.findByRole('complementary', { name: 'Play on another device' }),
    ).toBeInTheDocument();
  });

  it('wraps the library in a card like every other panel on the page', () => {
    renderInAnAddress(<MusicPage />);

    const aside = document.querySelector('aside');

    expect(aside).toHaveClass('valence-card-shell');
    expect(aside?.firstElementChild).toHaveClass('valence-card-face');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicPage.displayName).toBe('MusicPage');
  });
});
