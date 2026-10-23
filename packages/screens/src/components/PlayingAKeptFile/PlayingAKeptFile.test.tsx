import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { rememberWatchedOffline } from '@ValenceClient/offline/watchedOffline';
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
  hasTrickplay: false,
};

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
  drawn.player = null;
});

/**
 * A server that says where this profile got to in the film, and when.
 *
 * @param positionSeconds - Where.
 * @param updatedAt - When.
 */
const serverSaysItGotTo = (positionSeconds: number, updatedAt: string) => {
  vi.stubGlobal('fetch', (input: string) =>
    Promise.resolve(
      input.startsWith('/api/progress')
        ? Response.json({
            progress: [
              {
                mediaId: HERE.mediaId,
                positionSeconds,
                durationSeconds: 6960,
                isFinished: false,
                updatedAt,
              },
            ],
          })
        : new Response('{}', { status: 404 }),
    ),
  );
};

describe('PlayingAKeptFile', () => {
  it('plays the file and hands back to whoever opened it', async () => {
    const onLeave = vi.fn();

    installATestClient({ held: aFakeHeldFiles([HERE]).held });
    renderInAnAddress(<PlayingAKeptFile file={HERE} onLeave={onLeave} />);

    await waitFor(() => {
      expect(drawn.player).not.toBeNull();
    });
    expect(drawn.player).toMatchObject({
      media: { id: HERE.mediaId, title: 'Arrival' },
      isImmersive: true,
    });
    expect(drawn.player?.keptDownloadId).toBe(HERE.downloadId);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop playing Arrival' }));

    expect(onLeave).toHaveBeenCalled();
  });

  it('carries on from where another device got to since it was watched here', async () => {
    installATestClient({ held: aFakeHeldFiles([HERE]).held });
    rememberWatchedOffline(HERE.mediaId, 300, 6960, null, Date.parse('2026-10-01T00:00:00.000Z'));
    serverSaysItGotTo(2000, '2026-10-02T00:00:00.000Z');

    renderInAnAddress(<PlayingAKeptFile file={HERE} onLeave={vi.fn()} />);

    await waitFor(() => {
      expect(drawn.player?.startSeconds).toBe(2000);
    });
  });

  it('carries on from where it got to here where that is newer than the server knows', async () => {
    installATestClient({ held: aFakeHeldFiles([HERE]).held });
    rememberWatchedOffline(HERE.mediaId, 3000, 6960, null, Date.parse('2026-10-03T00:00:00.000Z'));
    serverSaysItGotTo(2000, '2026-10-02T00:00:00.000Z');

    renderInAnAddress(<PlayingAKeptFile file={HERE} onLeave={vi.fn()} />);

    await waitFor(() => {
      expect(drawn.player?.startSeconds).toBe(3000);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlayingAKeptFile.displayName).toBe('PlayingAKeptFile');
  });
});
