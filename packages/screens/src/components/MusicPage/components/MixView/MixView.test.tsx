import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { MixView } from './MixView';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const MIX = {
  id: 'decade-2020',
  kind: 'decade',
  title: '2020s Mix',
  detail: 'Music from the 2020s',
  trackCount: 2,
  coverAlbumIds: [],
  tracks: [aTrack(1), aTrack(2)],
};

beforeEach(() => {
  fake = aFakeMusicPlayer();
});

describe('MixView', () => {
  it('lists a mix’s songs under its name, made by Valence, and plays them', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/mixes/decade-2020': MIX }));

    renderInAnAddress(<MixView mixId="decade-2020" />);

    expect(await screen.findByRole('list', { name: '2020s Mix' })).toBeInTheDocument();
    expect(screen.getByText('Made by Valence')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(fake.player.play).toHaveBeenCalledWith([aTrack(1), aTrack(2)], 0, {
      source: { kind: 'tracks', id: 'decade-2020', name: '2020s Mix' },
    });
  });

  it('shuffles a mix', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({ '/api/music/mixes/decade-2020': MIX }));

    renderInAnAddress(<MixView mixId="decade-2020" />);

    await screen.findByRole('list', { name: '2020s Mix' });
    await userEvent.click(screen.getByRole('button', { name: 'Shuffle' }));

    expect(fake.player.play).toHaveBeenCalledWith(
      MIX.tracks,
      expect.any(Number),
      expect.objectContaining({ isShuffled: true }),
    );
  });

  it('says there is no such mix where one from another day is asked for', async () => {
    vi.stubGlobal('fetch', answerMusicRequests());

    renderInAnAddress(<MixView mixId="decade-1950" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('There’s no such mix today.');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MixView.displayName).toBe('MixView');
  });
});
