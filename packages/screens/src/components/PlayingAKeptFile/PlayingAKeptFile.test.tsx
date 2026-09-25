import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { PlayingAKeptFile } from './PlayingAKeptFile';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { VideoPlayerProps } from '@ValenceScreens/components/VideoPlayer/VideoPlayer.types';

const drawn = vi.hoisted((): { player: VideoPlayerProps | null } => ({ player: null }));

vi.mock('@ValenceScreens/components/VideoPlayer/VideoPlayer', () => ({
  VideoPlayer: (props: VideoPlayerProps) => {
    drawn.player = props;

    return (
      <button type="button" onClick={props.onClose}>
        Stop playing {props.media.title}
      </button>
    );
  },
}));

const HERE: HeldFile = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  durationSeconds: 6960,
  ofBytes: 4_000_000_000,
  state: 'here',
  bytes: 4_000_000_000,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-01-01T00:20:00.000Z',
  hasPoster: false,
};

afterEach(() => {
  forgetPlatform();
});

describe('PlayingAKeptFile', () => {
  it('plays the file and hands back to whoever opened it', async () => {
    const onLeave = vi.fn();

    installATestClient({ held: aFakeHeldFiles([HERE]).held });
    render(<PlayingAKeptFile file={HERE} onLeave={onLeave} />);

    expect(drawn.player).toMatchObject({
      media: { id: HERE.mediaId, title: 'Arrival' },
      isImmersive: true,
    });
    expect(drawn.player?.keptSource).toBe(`/held/${HERE.downloadId}`);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop playing Arrival' }));

    expect(onLeave).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlayingAKeptFile.displayName).toBe('PlayingAKeptFile');
  });
});
