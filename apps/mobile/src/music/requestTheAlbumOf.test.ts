import { ActionSheetIOS, Alert } from 'react-native';
import { searchAskable } from '@ValenceClient/requests/fetchAskable';
import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { requestTheAlbumOf } from './requestTheAlbumOf';

jest.mock('@ValenceClient/requests/fetchAskable');
jest.mock('@ValenceClient/requests/fetchMediaRequests');

const anAlbum = (id: string, title: string, status: 'askable' | 'library' | 'requested') => ({
  kind: 'album' as const,
  id,
  title,
  subtitle: 'Mara Quill',
  year: 2024,
  overview: null,
  posterUrl: null,
  standing: { status, mediaId: null, requestId: null, requestState: null },
});

const SONG = { title: 'Low Tide', artist: 'Mara Quill', album: 'Coastal', releaseId: null };

const alert = jest.spyOn(Alert, 'alert');

beforeEach(() => {
  alert.mockReset().mockImplementation(jest.fn());
});

describe('requestTheAlbumOf', () => {
  it('offers the albums the library does not have, and requests the one chosen', async () => {
    const onRequested = jest.fn();

    jest
      .mocked(searchAskable)
      .mockResolvedValue([anAlbum('a1', 'Coastal', 'askable'), anAlbum('a2', 'Held', 'library')]);
    jest.mocked(askForMedia).mockResolvedValue({ value: aMediaRequest(), refusal: null });

    const sheet = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_, told) => {
        told(0);
      });

    await requestTheAlbumOf(SONG, onRequested);
    await Promise.resolve();

    expect(searchAskable).toHaveBeenCalledWith('Mara Quill Coastal', 'album');
    expect(sheet.mock.calls[0]?.[0].options).toEqual(['Coastal · Mara Quill', 'Cancel']);
    expect(askForMedia).toHaveBeenCalledWith({
      kind: 'album',
      musicBrainzId: 'a1',
      seasons: null,
      isPickedByHand: false,
    });
    expect(onRequested).toHaveBeenCalledTimes(1);
  });

  it('says so when the catalogue has no album for it', async () => {
    jest.mocked(searchAskable).mockResolvedValue([]);

    await requestTheAlbumOf({ ...SONG, album: null }, jest.fn());

    expect(searchAskable).toHaveBeenCalledWith('Mara Quill Low Tide', 'album');
    expect(alert).toHaveBeenCalledWith('No album was found for it in the catalogue.');
  });
});
