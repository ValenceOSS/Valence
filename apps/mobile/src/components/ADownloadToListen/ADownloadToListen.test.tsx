import { act, render, userEvent } from '@testing-library/react-native';
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
import { showActionSheet } from '@ValenceMobile/platform/showActionSheet';
import { aFakeListeningFiles } from '@ValenceClient/testing/aFakeListeningFiles';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { keptAlready } from '@ValenceMobile/testing/keptAlready';
import { ADownloadToListen } from './ADownloadToListen';
import type { ListeningToKeep } from '@ValenceClient/downloads/keptListeningOf';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';

jest.mock('@ValenceMobile/platform/showActionSheet', () => ({ showActionSheet: jest.fn() }));

const TRACKS = [aTrack(1), aTrack(2)];

let fake = aFakeListeningFiles();

let platform = aFakePlatform();

/**
 * What downloading the album at a quality keeps.
 *
 * @param quality - The quality chosen.
 * @returns What to keep.
 */
const theAlbumAt = (quality: AudioQuality): ListeningToKeep => ({
  kind: 'album',
  detail: { album: anAlbum(), tracks: TRACKS },
  quality,
});

/**
 * The button for downloading the album.
 *
 * @returns It, drawn.
 */
const theAlbumsButton = () =>
  render(
    <ADownloadToListen
      kind="album"
      id={anAlbum().id}
      title="Even In Arcadia"
      tracks={TRACKS}
      toKeep={theAlbumAt}
    />,
  );

/**
 * Picks a choice from the action sheet as somebody would.
 *
 * @param picked - Where the choice is in the sheet.
 */
const picking = (picked: number): void => {
  jest.mocked(showActionSheet).mockImplementation((_sheet, onPicked) => {
    onPicked(picked);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  forgetTheKeptListening();
  fake = aFakeListeningFiles();
  platform = aFakePlatform({ listeningFiles: fake.files });
  installPlatform(platform);
});

describe('ADownloadToListen', () => {
  it('asks which quality to download music at, and keeps it at the one chosen', async () => {
    picking(1);
    const drawn = await theAlbumsButton();

    await userEvent.press(drawn.getByRole('button', { name: 'Download' }));

    expect(showActionSheet).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Download Even In Arcadia', cancelButtonIndex: 4 }),
      expect.any(Function),
    );
    expect(jest.mocked(showActionSheet).mock.calls[0]?.[0].options.at(-1)).toBe('Cancel');
    expect(await drawn.findByRole('button', { name: 'Downloading 0 of 2' })).toBeTruthy();
    expect(theKeptListening().shelf().kept[0]).toMatchObject({
      kind: 'album',
      id: anAlbum().id,
      quality: 'high',
    });
    expect(fake.asked[0]).toBe(`track-${aTrack(1).id}-high.m4a`);
  });

  it('keeps nothing where somebody cancels', async () => {
    picking(4);
    const drawn = await theAlbumsButton();

    await userEvent.press(drawn.getByRole('button', { name: 'Download' }));

    expect(theKeptListening().shelf().kept).toEqual([]);
    expect(drawn.getByRole('button', { name: 'Download' })).toBeTruthy();
  });

  it('downloads an audiobook straight away, with no quality to ask about', async () => {
    const drawn = await render(
      <ADownloadToListen
        kind="audiobook"
        id={anAudiobook().book.id}
        title="Red Rising"
        tracks={[]}
        toKeep={() => ({ kind: 'audiobook', detail: anAudiobook() })}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Download' }));

    expect(await drawn.findByRole('button', { name: 'Downloading 0 of 2' })).toBeTruthy();
    expect(showActionSheet).not.toHaveBeenCalled();
    expect(theKeptListening().shelf().kept[0]).toMatchObject({ kind: 'audiobook', quality: null });
  });

  it('pauses a download when pressed, and carries on with it when pressed again', async () => {
    picking(1);
    const drawn = await theAlbumsButton();

    await userEvent.press(drawn.getByRole('button', { name: 'Download' }));
    await userEvent.press(await drawn.findByRole('button', { name: 'Downloading 0 of 2' }));

    expect(await drawn.findByRole('button', { name: 'Paused at 0 of 2' })).toBeTruthy();
    expect(fake.stopped).toEqual([`track-${aTrack(1).id}-high.m4a`]);

    await userEvent.press(drawn.getByRole('button', { name: 'Paused at 0 of 2' }));

    expect(await drawn.findByRole('button', { name: 'Downloading 0 of 2' })).toBeTruthy();
  });

  it('says how far a download has got as its songs arrive', async () => {
    picking(1);
    const drawn = await theAlbumsButton();

    await userEvent.press(drawn.getByRole('button', { name: 'Download' }));
    await drawn.findByRole('button', { name: 'Downloading 0 of 2' });

    await act(async () => {
      fake.finish(`track-${aTrack(1).id}-high.m4a`);
      await Promise.resolve();
    });

    expect(await drawn.findByRole('button', { name: 'Downloading 1 of 2' })).toBeTruthy();

    await act(async () => {
      fake.finish(`track-${aTrack(2).id}-high.m4a`);
      await Promise.resolve();
    });

    expect(await drawn.findByRole('button', { name: 'Downloaded' })).toBeTruthy();
  });

  it('asks before taking a downloaded album off the phone, offering to download it again', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    keptAlready(platform.store, [keptListeningOf(theAlbumAt('high'))]);
    const keeping = jest.spyOn(theKeptListening(), 'keep');
    const drawn = await theAlbumsButton();

    await userEvent.press(drawn.getByRole('button', { name: 'Downloaded' }));

    expect(alert).toHaveBeenCalledWith(
      'Remove the download of Even In Arcadia?',
      'It comes off this device. You can download it again whenever you’re online.',
      expect.any(Array),
    );

    const choices = alert.mock.calls[0]?.[2] ?? [];

    expect(choices.map((choice) => choice.text)).toEqual([
      'Keep it',
      'Download it again',
      'Remove the download',
    ]);

    await act(async () => {
      choices[1]?.onPress?.();
      await Promise.resolve();
    });

    expect(keeping).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'album', id: anAlbum().id, quality: 'high' }),
    );

    await act(async () => {
      choices[2]?.onPress?.();
      await Promise.resolve();
    });

    expect(await drawn.findByRole('button', { name: 'Download' })).toBeTruthy();
    expect(theKeptListening().shelf().kept).toEqual([]);
    expect(fake.dropped).toContain(`track-${aTrack(1).id}-high.m4a`);
  });
});
