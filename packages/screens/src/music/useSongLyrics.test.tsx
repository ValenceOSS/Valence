import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { useSongLyrics } from './useSongLyrics';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';

const TRACK = aTrack(1, { hasLyrics: true });

const LYRICS = {
  isSynced: true,
  lines: [
    { atMs: 1000, text: 'First line' },
    { atMs: 5000, text: 'Second line' },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', answerMusicRequests({ [`/api/music/tracks/${TRACK.id}/lyrics`]: LYRICS }));
});

const Probe = ({ player, isWanted = true }: { player: MusicPlayer; isWanted?: boolean }) => {
  const { shown, lyrics, at } = useSongLyrics(player, isWanted);

  return (
    <p>
      {shown?.title ?? 'nothing'} ·{' '}
      {lyrics === null ? 'no words' : `${lyrics.lines.length.toString()} lines`} · {at}
    </p>
  );
};

describe('useSongLyrics', () => {
  it('follows the song playing, its words and the line being sung', async () => {
    const { player } = aFakeMusicPlayer({ current: TRACK, isPlaying: true, positionSeconds: 6 });

    renderInAnAddress(<Probe player={player} />);

    expect(await screen.findByText('Track 1 · 2 lines · 1')).toBeInTheDocument();
  });

  it('asks for no words while nothing needs them', async () => {
    const { player } = aFakeMusicPlayer({ current: TRACK, isPlaying: true, positionSeconds: 6 });

    renderInAnAddress(<Probe player={player} isWanted={false} />);

    expect(await screen.findByText('Track 1 · no words · -1')).toBeInTheDocument();
  });

  it('has nothing to follow while nothing plays', async () => {
    const { player } = aFakeMusicPlayer({ current: null });

    renderInAnAddress(<Probe player={player} />);

    expect(await screen.findByText('nothing · no words · -1')).toBeInTheDocument();
  });
});
