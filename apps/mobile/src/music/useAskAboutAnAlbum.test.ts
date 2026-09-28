import { ActionSheetIOS } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';
import { fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { useMyPlaylists } from '@ValenceClient/music/useMyPlaylists';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { askWhichPlaylist } from '@ValenceMobile/music/askWhichPlaylist';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useAskAboutAnAlbum } from './useAskAboutAnAlbum';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchAlbum: jest.fn(),
}));

jest.mock('@ValenceClient/music/useMyPlaylists');

jest.mock('@ValenceMobile/music/askWhichPlaylist');

const ALBUM = { id: 'album', title: 'Even In Arcadia' };

const pick = (label: string) => {
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((sheet, picked) => {
    picked(sheet.options.indexOf(label));
  });
};

const asking = async () => {
  const { result } = await renderHook(() => useAskAboutAnAlbum());

  result.current(ALBUM);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useMyPlaylists).mockReturnValue({ mine: [], changed: jest.fn() });
  jest.mocked(fetchAlbum).mockResolvedValue({ album: anAlbum(), tracks: [aTrack(1), aTrack(2)] });
  thePhonesMusicPlayer().stop();
});

describe('useAskAboutAnAlbum', () => {
  it('offers what can be done with the album, named for it', async () => {
    const sheet = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(jest.fn());

    await asking();

    expect(sheet.mock.calls[0]?.[0]).toMatchObject({
      title: 'Even In Arcadia',
      options: ['Play', 'Shuffle', 'Play next', 'Add to queue', 'Add to playlist…', 'Cancel'],
      cancelButtonIndex: 5,
    });
  });

  it('plays the album from its first song', async () => {
    pick('Play');

    await asking();

    await waitFor(() => {
      expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(1).id);
    });
  });

  it('puts the album in a playlist, reading its songs only once one is chosen', async () => {
    pick('Add to playlist…');

    await asking();

    expect(askWhichPlaylist).toHaveBeenCalledWith(
      'Even In Arcadia',
      expect.any(Function),
      [],
      expect.any(Function),
      undefined,
    );
    expect(fetchAlbum).not.toHaveBeenCalled();
  });
});
