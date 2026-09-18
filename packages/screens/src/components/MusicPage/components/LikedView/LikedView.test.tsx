import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { LikedView } from './LikedView';

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

beforeEach(() => {
  fake = aFakeMusicPlayer();
});

describe('LikedView', () => {
  it('lists the songs this profile likes, and plays them', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/liked': { tracks: [aTrack(1)] } }));

    renderInAnAddress(<LikedView />);

    expect(await screen.findByRole('list', { name: 'Liked Songs' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play Liked Songs' }));

    expect(fake.player.play).toHaveBeenCalledWith([aTrack(1)], 0, expect.anything());
  });

  it('says how to fill it where it is empty', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/liked': { tracks: [] } }));

    renderInAnAddress(<LikedView />);

    expect(await screen.findByText('Songs you like will be here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Liked Songs' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LikedView.displayName).toBe('LikedView');
  });
});
