import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { setMusicPanel } from '@ValenceScreens/music/musicPanel';
import { MusicPage } from './MusicPage';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => aFakeMusicPlayer().player,
}));

const atWidth = (isWide: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isWide,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

beforeEach(() => {
  atWidth(true);
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

describe('MusicPage on a narrow screen', () => {
  it('keeps the library away until it is asked for, then draws it as a drawer', async () => {
    atWidth(false);

    renderInAnAddress(<MusicPage />);

    expect(screen.queryByRole('navigation', { name: 'Your library' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Your library' }));

    expect(await screen.findByRole('navigation', { name: 'Your library' })).toBeInTheDocument();
  });

  it('draws the queue as a drawer rather than a column beside the page', async () => {
    atWidth(false);

    renderInAnAddress(<MusicPage />);

    act(() => {
      setMusicPanel('queue');
    });

    expect(await screen.findByRole('dialog', { name: 'Queue' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Queue' })).not.toBeInTheDocument();
  });
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

  it('draws the library and the page in a glass-edged card the colour of the admin sidebar', () => {
    renderInAnAddress(<MusicPage />);

    const aside = document.querySelector('aside');

    expect(aside).toHaveClass('valence-card-shell');
    expect(aside?.firstElementChild).toHaveClass('valence-card-face--raised');
    expect(screen.getByRole('region', { name: 'Music' })).toHaveClass('valence-card-shell');
  });

  it('gives the lyrics the whole height of the page, so their glow reaches its top edge', () => {
    window.history.pushState(null, '', '/music?listen=lyrics');

    renderInAnAddress(<MusicPage />);

    expect(document.querySelector('.relative.flex.flex-col')).not.toHaveClass('pt-2');

    window.history.pushState(null, '', '/');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicPage.displayName).toBe('MusicPage');
  });
});
