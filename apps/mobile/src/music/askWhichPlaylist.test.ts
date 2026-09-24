import { ActionSheetIOS } from 'react-native';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { askWhichPlaylist } from './askWhichPlaylist';

jest.mock('@ValenceClient/music/fetchPlaylists');

const ROAD_TRIP = aPlaylist();

const pick = (at: number) => {
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
    picked(at);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('askWhichPlaylist', () => {
  it('adds the song to the playlist picked', async () => {
    jest.mocked(addToPlaylist).mockResolvedValue(true);
    const onChanged = jest.fn();

    pick(1);
    askWhichPlaylist(aTrack(1), [ROAD_TRIP], onChanged, undefined);

    await new Promise(setImmediate);

    expect(addToPlaylist).toHaveBeenCalledWith(ROAD_TRIP.id, [aTrack(1).id]);
    expect(onChanged).toHaveBeenCalled();
  });

  it('makes a new playlist holding the song, and opens it', async () => {
    jest.mocked(createPlaylist).mockResolvedValue({ ...ROAD_TRIP, id: 'new' });
    const onPlaylist = jest.fn();

    pick(0);
    askWhichPlaylist(aTrack(1), [ROAD_TRIP], jest.fn(), onPlaylist);

    await new Promise(setImmediate);

    expect(createPlaylist).toHaveBeenCalledWith({ name: 'Track 1', mediaItemIds: [aTrack(1).id] });
    expect(onPlaylist).toHaveBeenCalledWith('new');
  });
});
