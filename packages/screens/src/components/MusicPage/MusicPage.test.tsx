import { act, screen, within } from '@testing-library/react';
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
    expect(screen.getByRole('navigation', { name: 'Music pages' })).toBeInTheDocument();
  });

  it('opens a page from the bar across the top', async () => {
    renderInAnAddress(<MusicPage />);

    const pages = await screen.findByRole('navigation', { name: 'Music pages' });

    await userEvent.click(within(pages).getByRole('button', { name: 'Liked' }));

    expect(await screen.findByRole('heading', { name: 'Liked Songs' })).toBeInTheDocument();
  });

  it('opens every album as a page of its own', async () => {
    renderInAnAddress(<MusicPage />);

    const pages = await screen.findByRole('navigation', { name: 'Music pages' });

    await userEvent.click(within(pages).getByRole('button', { name: 'Albums' }));

    expect(await screen.findByText('No albums yet')).toBeInTheDocument();
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

  it('sets a display name so devtools can identify it', () => {
    expect(MusicPage.displayName).toBe('MusicPage');
  });
});
