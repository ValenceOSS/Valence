import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { MixShelf } from './MixShelf';
import type { MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

const MIX: MusicMixSummary = {
  id: 'decade-2020',
  kind: 'decade',
  title: '2020s Mix',
  detail: 'Music from the 2020s',
  trackCount: 1,
  coverAlbumIds: [],
};

beforeEach(() => {
  fake = aFakeMusicPlayer();
  vi.stubGlobal(
    'fetch',
    answerMusicRequests({ '/api/music/mixes/decade-2020': { ...MIX, tracks: [aTrack(1)] } }),
  );
});

describe('MixShelf', () => {
  it('draws nothing where no mixes have been made', () => {
    const { container } = renderInAnAddress(<MixShelf mixes={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows each mix made for this profile under Made for you', () => {
    renderInAnAddress(<MixShelf mixes={[MIX]} />);

    expect(screen.getByRole('region', { name: 'Made for you' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^2020s Mix/ })).toBeInTheDocument();
  });

  it('plays a mix straight from the shelf, saying it came from that mix', async () => {
    renderInAnAddress(<MixShelf mixes={[MIX]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play 2020s Mix' }));

    await waitFor(() => {
      expect(fake.player.play).toHaveBeenCalledWith([aTrack(1)], 0, {
        source: { kind: 'tracks', id: 'decade-2020', name: '2020s Mix' },
      });
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MixShelf.displayName).toBe('MixShelf');
  });
});
