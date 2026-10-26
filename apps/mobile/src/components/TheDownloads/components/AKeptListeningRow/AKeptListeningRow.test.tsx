import { act, render, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { keptListeningOf } from '@ValenceClient/downloads/keptListeningOf';
import {
  forgetTheKeptListening,
  theKeptListening,
} from '@ValenceClient/downloads/theKeptListening';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { AKeptListeningRow } from './AKeptListeningRow';
import type { KeptListeningStanding } from '@ValenceClient/downloads/standingOfKeptListening';

const mockMusic = { play: jest.fn() };

jest.mock('@ValenceMobile/music/thePhonesMusicPlayer', () => ({
  thePhonesMusicPlayer: () => mockMusic,
}));

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

jest.mock('@ValenceClient/books/fetchListening', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchListening'),
  fetchListeningProgress: jest.fn(() => Promise.resolve(null)),
}));

const TRACKS = [aTrack(1), aTrack(2)];

/**
 * How far a download has got.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns Where it stands.
 */
const standing = (overrides: Partial<KeptListeningStanding> = {}): KeptListeningStanding => ({
  state: 'here',
  filesHere: 2,
  filesInAll: 2,
  bytes: 0,
  failure: null,
  ...overrides,
});

/**
 * The album as the phone keeps it.
 *
 * @returns What is kept.
 */
const theAlbum = () =>
  keptListeningOf({
    kind: 'album',
    detail: { album: anAlbum(), tracks: TRACKS },
    quality: 'high',
  });

beforeEach(() => {
  jest.clearAllMocks();
  forgetTheKeptListening();
  mockFake = aFakeAudiobookPlayer();
  installPlatform(aFakePlatform({ listeningFiles: aFakeListeningFiles().files }));
});

describe('AKeptListeningRow', () => {
  it('says what is kept and how far it has got', async () => {
    const drawn = await render(
      <AKeptListeningRow
        kept={theAlbum()}
        standing={standing({ state: 'fetching', filesHere: 1 })}
        onPlaying={jest.fn()}
      />,
    );

    expect(drawn.getByText('Even In Arcadia')).toBeTruthy();
    expect(drawn.getByText('Sleep Token · Downloading 1 of 2')).toBeTruthy();
    expect(drawn.getByLabelText('Download progress for Even In Arcadia')).toBeTruthy();
  });

  it('plays kept music on the phone’s music player, and says the music player has it', async () => {
    const onPlaying = jest.fn();
    const kept = theAlbum();
    const drawn = await render(
      <AKeptListeningRow kept={kept} standing={standing()} onPlaying={onPlaying} />,
    );

    expect(drawn.queryByLabelText('Download progress for Even In Arcadia')).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Play Even In Arcadia' }));

    expect(mockMusic.play).toHaveBeenCalledWith(TRACKS, 0, {
      source: { kind: 'album', id: anAlbum().id, name: 'Even In Arcadia' },
    });
    expect(onPlaying).toHaveBeenCalledWith('music');
  });

  it('offers nothing to play before a single song has arrived', async () => {
    const drawn = await render(
      <AKeptListeningRow
        kept={theAlbum()}
        standing={standing({ state: 'fetching', filesHere: 0 })}
        onPlaying={jest.fn()}
      />,
    );

    expect(drawn.queryByRole('button', { name: 'Play Even In Arcadia' })).toBeNull();
  });

  it('starts listening to a kept audiobook, and says the audiobook player has it', async () => {
    const onPlaying = jest.fn();
    const drawn = await render(
      <AKeptListeningRow
        kept={keptListeningOf({ kind: 'audiobook', detail: anAudiobook() })}
        standing={standing()}
        onPlaying={onPlaying}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play Red Rising' }));

    await waitFor(() => {
      expect(onPlaying).toHaveBeenCalledWith('book');
    });
    expect(mockFake.player.read().book?.id).toBe(anAudiobook().book.id);
    expect(mockMusic.play).not.toHaveBeenCalled();
  });

  it('pauses a download, and carries on with a paused one', async () => {
    const pausing = jest.spyOn(theKeptListening(), 'pause');
    const fetching = await render(
      <AKeptListeningRow
        kept={theAlbum()}
        standing={standing({ state: 'fetching', filesHere: 0 })}
        onPlaying={jest.fn()}
      />,
    );

    await userEvent.press(fetching.getByRole('button', { name: 'Pause Even In Arcadia' }));

    expect(pausing).toHaveBeenCalledWith('album', anAlbum().id, true);

    await fetching.unmount();

    const paused = await render(
      <AKeptListeningRow
        kept={theAlbum()}
        standing={standing({ state: 'paused', filesHere: 0 })}
        onPlaying={jest.fn()}
      />,
    );

    await userEvent.press(
      paused.getByRole('button', { name: 'Resume downloading Even In Arcadia' }),
    );

    expect(pausing).toHaveBeenLastCalledWith('album', anAlbum().id, false);
  });

  it('asks before taking what is kept off the phone', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const dropping = jest.spyOn(theKeptListening(), 'drop');
    const drawn = await render(
      <AKeptListeningRow kept={theAlbum()} standing={standing()} onPlaying={jest.fn()} />,
    );

    await userEvent.press(
      drawn.getByRole('button', { name: 'Remove Even In Arcadia from this device' }),
    );

    expect(dropping).not.toHaveBeenCalled();

    const choices = alert.mock.calls[0]?.[2] ?? [];

    expect(choices.map((choice) => choice.text)).toEqual(['Keep it', 'Remove the download']);

    await act(async () => {
      choices[1]?.onPress?.();
      await Promise.resolve();
    });

    expect(dropping).toHaveBeenCalledWith('album', anAlbum().id);
  });
});
