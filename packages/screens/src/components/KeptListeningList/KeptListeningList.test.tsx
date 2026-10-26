import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keptArtworkName } from '@ValenceClient/downloads/filesOfKeptListening';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import {
  forgetTheKeptListening,
  theKeptListening,
} from '@ValenceClient/downloads/theKeptListening';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aKeptListening } from '@ValenceClient/testing/aKeptListening';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { fetchEveryFileOf } from '@ValenceClient/testing/fetchEveryFileOf';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { KeptListeningList } from './KeptListeningList';

const { startListening } = vi.hoisted(() => ({
  startListening: vi.fn(() => Promise.resolve()),
}));

vi.mock('@ValenceClient/books/startListening', () => ({ startListening }));

vi.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => audiobooks.player,
}));

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => music.player,
}));

const audiobooks = aFakeAudiobookPlayer();

let music = aFakeMusicPlayer();

let fake = aFakeListeningFiles();

const ALBUM = aKeptListening();

beforeEach(() => {
  music = aFakeMusicPlayer();
  fake = aFakeListeningFiles();
  startListening.mockClear();
  installATestClient({ listeningFiles: fake.files });
  forgetTheKeptListening();
});

describe('KeptListeningList', () => {
  it('draws nothing where nothing is kept', () => {
    renderInAnAddress(<KeptListeningList />);

    expect(screen.queryByRole('heading', { name: 'Music and audiobooks' })).not.toBeInTheDocument();
  });

  it('lists each album and audiobook kept under its own heading', async () => {
    await theKeptListening().keep(ALBUM);
    await theKeptListening().keep(keptListeningOf({ kind: 'audiobook', detail: anAudiobook() }));

    renderInAnAddress(<KeptListeningList />);

    expect(screen.getByRole('heading', { name: 'Music and audiobooks' })).toBeInTheDocument();
    expect(screen.getByText('Even In Arcadia')).toBeInTheDocument();
    expect(screen.getByText('Red Rising')).toBeInTheDocument();
  });

  it('says how far a download has got, with a bar, and offers nothing to play yet', async () => {
    await theKeptListening().keep(ALBUM);

    renderInAnAddress(<KeptListeningList />);

    expect(screen.getByText('Sleep Token · Downloading 0 of 2')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Download progress for Even In Arcadia' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play Even In Arcadia' })).not.toBeInTheDocument();
  });

  it('says an album has all arrived, with no bar and no pausing', async () => {
    await theKeptListening().keep(ALBUM);
    await fetchEveryFileOf(fake, ALBUM);

    renderInAnAddress(<KeptListeningList />);

    expect(await screen.findByText(/Sleep Token · Downloaded/)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause Even In Arcadia' })).not.toBeInTheDocument();
  });

  it('plays an album through the music player, saying it plays from the album', async () => {
    await theKeptListening().keep(ALBUM);
    await fetchEveryFileOf(fake, ALBUM);

    renderInAnAddress(<KeptListeningList />);

    await userEvent.click(await screen.findByRole('button', { name: 'Play Even In Arcadia' }));

    expect(music.player.play).toHaveBeenCalledWith(ALBUM.tracks, 0, {
      source: { kind: 'album', id: ALBUM.id, name: ALBUM.title },
    });
  });

  it('plays an audiobook through the audiobook player', async () => {
    const book = keptListeningOf({ kind: 'audiobook', detail: anAudiobook() });

    await theKeptListening().keep(book);
    await fetchEveryFileOf(fake, book);

    renderInAnAddress(<KeptListeningList />);

    await userEvent.click(await screen.findByRole('button', { name: 'Play Red Rising' }));

    expect(startListening).toHaveBeenCalledWith(
      { book: book.book, chapters: book.chapters },
      audiobooks.player,
    );
    expect(music.player.play).not.toHaveBeenCalled();
  });

  it('pauses a download and carries it on', async () => {
    await theKeptListening().keep(ALBUM);

    renderInAnAddress(<KeptListeningList />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause Even In Arcadia' }));

    expect(fake.stopped).toEqual([keptArtworkName(ALBUM)]);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Resume downloading Even In Arcadia' }),
    );

    await waitFor(() => {
      expect(fake.asked).toEqual([keptArtworkName(ALBUM), keptArtworkName(ALBUM)]);
    });
    expect(await screen.findByText('Sleep Token · Downloading 0 of 2')).toBeInTheDocument();
  });

  it('takes a download off the device', async () => {
    await theKeptListening().keep(ALBUM);
    await fetchEveryFileOf(fake, ALBUM);

    renderInAnAddress(<KeptListeningList />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove Even In Arcadia from this device' }),
    );

    await waitFor(() => {
      expect(screen.queryByText('Even In Arcadia')).not.toBeInTheDocument();
    });
    expect(fake.dropped).toHaveLength(3);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(KeptListeningList.displayName).toBe('KeptListeningList');
  });
});
