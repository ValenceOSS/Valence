import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import {
  forgetTheKeptListening,
  theKeptListening,
} from '@ValenceClient/downloads/theKeptListening';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { fetchEveryFileOf } from '@ValenceClient/testing/fetchEveryFileOf';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';
import { DownloadToListen } from './DownloadToListen';

const TRACKS = [aTrack(1), aTrack(2)];

const LIKED = 'Liked songs';

let fake = aFakeListeningFiles();

/**
 * Draws the download button for liked songs.
 */
const drawLiked = () => {
  renderInAnAddress(
    <DownloadToListen
      kind="liked"
      id="liked"
      title={LIKED}
      tracks={TRACKS}
      toKeep={(quality: AudioQuality) => ({ kind: 'liked', tracks: TRACKS, quality })}
    />,
  );
};

/**
 * What the liked songs are kept as, at a quality.
 *
 * @param quality - The quality chosen.
 * @returns What is kept.
 */
const likedAt = (quality: AudioQuality) =>
  keptListeningOf({ kind: 'liked', tracks: TRACKS, quality });

beforeEach(() => {
  fake = aFakeListeningFiles();
  installATestClient({ listeningFiles: fake.files });
  forgetTheKeptListening();
});

describe('DownloadToListen', () => {
  it('draws nothing where this client keeps no files', () => {
    installATestClient({ canKeepFiles: () => false, listeningFiles: fake.files });
    drawLiked();

    expect(screen.queryByRole('button', { name: 'Download Liked songs' })).not.toBeInTheDocument();
  });

  it('offers each quality with roughly how much room it takes', async () => {
    drawLiked();

    await userEvent.click(screen.getByRole('button', { name: 'Download Liked songs' }));

    expect(await screen.findByRole('menuitem', { name: /Lossless/ })).toHaveTextContent(
      formatBytes(70_525_000),
    );
    expect(screen.getByRole('menuitem', { name: /High/ })).toHaveTextContent(
      formatBytes(16_120_000),
    );
    expect(screen.getByRole('menuitem', { name: /Normal/ })).toHaveTextContent(
      formatBytes(8_060_000),
    );
    expect(screen.getByRole('menuitem', { name: /Data saver/ })).toHaveTextContent(
      formatBytes(4_836_000),
    );
  });

  it('says what a lossless download is where a song’s size cannot be told', async () => {
    renderInAnAddress(
      <DownloadToListen
        kind="liked"
        id="liked"
        title={LIKED}
        tracks={[aTrack(1, { bitrateKbps: null })]}
        toKeep={(quality: AudioQuality) => ({ kind: 'liked', tracks: TRACKS, quality })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Download Liked songs' }));

    expect(await screen.findByRole('menuitem', { name: /Lossless/ })).not.toHaveTextContent(/MB/);
  });

  it('keeps the songs at the quality chosen', async () => {
    drawLiked();

    await userEvent.click(screen.getByRole('button', { name: 'Download Liked songs' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Normal/ }));

    await waitFor(() => {
      expect(fake.asked).toEqual([`track-${TRACKS[0]?.id ?? ''}-normal.m4a`]);
    });
    expect(theKeptListening().shelf().kept[0]?.quality).toBe('normal');
  });

  it('offers an audiobook as a single download, at no quality of its own', async () => {
    const detail = anAudiobook();

    renderInAnAddress(
      <DownloadToListen
        kind="audiobook"
        id={detail.book.id}
        title="Red Rising"
        tracks={[]}
        toKeep={() => ({ kind: 'audiobook', detail })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Download Red Rising' }));

    expect(await screen.findAllByRole('menuitem')).toHaveLength(1);

    await userEvent.click(screen.getByRole('menuitem', { name: 'Download' }));

    await waitFor(() => {
      expect(theKeptListening().shelf().kept[0]?.id).toBe(detail.book.id);
    });
  });

  it('says how far a download has got, and pauses it', async () => {
    await theKeptListening().keep(likedAt('high'));
    drawLiked();

    await userEvent.click(screen.getByRole('button', { name: 'Downloading 0 of 2' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pause Liked songs' }));

    await waitFor(() => {
      expect(fake.stopped).toEqual([`track-${TRACKS[0]?.id ?? ''}-high.m4a`]);
    });
    expect(await screen.findByRole('button', { name: 'Paused at 0 of 2' })).toBeInTheDocument();
  });

  it('carries on with a paused download', async () => {
    await theKeptListening().keep(likedAt('high'));
    await theKeptListening().pause('liked', 'liked', true);
    drawLiked();

    await userEvent.click(screen.getByRole('button', { name: 'Paused at 0 of 2' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Resume downloading Liked songs' }),
    );

    expect(await screen.findByRole('button', { name: 'Downloading 0 of 2' })).toBeInTheDocument();
  });

  it('says a download has arrived, offering to fetch it again or take it off but not to pause', async () => {
    await theKeptListening().keep(likedAt('high'));
    await fetchEveryFileOf(fake, likedAt('high'));
    drawLiked();

    await userEvent.click(await screen.findByRole('button', { name: 'Downloaded' }));

    expect(await screen.findByRole('menuitem', { name: 'Download it again' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Remove the download' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Pause Liked songs' })).not.toBeInTheDocument();
  });

  it('fetches it again at the quality it was kept at', async () => {
    await theKeptListening().keep(likedAt('low'));
    await fetchEveryFileOf(fake, likedAt('low'));
    drawLiked();

    await userEvent.click(await screen.findByRole('button', { name: 'Downloaded' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Download it again' }));

    expect(theKeptListening().shelf().kept[0]?.quality).toBe('low');
  });

  it('takes a download off the device', async () => {
    await theKeptListening().keep(likedAt('high'));
    await fetchEveryFileOf(fake, likedAt('high'));
    drawLiked();

    await userEvent.click(await screen.findByRole('button', { name: 'Downloaded' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove the download' }));

    expect(await screen.findByRole('button', { name: 'Download Liked songs' })).toBeInTheDocument();
    expect(fake.dropped).toHaveLength(2);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadToListen.displayName).toBe('DownloadToListen');
  });
});
