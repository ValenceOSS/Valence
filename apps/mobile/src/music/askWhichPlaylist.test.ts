import { ActionSheetIOS, Alert } from 'react-native';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { askWhichPlaylist } from './askWhichPlaylist';

jest.mock('@ValenceClient/music/fetchPlaylists');

const ROAD_TRIP = aPlaylist();

const pick = (at: number) => {
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, picked) => {
    picked(at);
  });
};

const alerted = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(alerted);
});

describe('askWhichPlaylist', () => {
  it('adds the songs to the playlist picked', async () => {
    jest.mocked(addToPlaylist).mockResolvedValue(true);
    const onChanged = jest.fn();

    pick(1);
    askWhichPlaylist('Blue', () => Promise.resolve(['a', 'b']), [ROAD_TRIP], onChanged, undefined);

    await new Promise(setImmediate);

    expect(addToPlaylist).toHaveBeenCalledWith(ROAD_TRIP.id, ['a', 'b']);
    expect(onChanged).toHaveBeenCalled();
  });

  it('makes a new playlist named for what is added, and opens it', async () => {
    jest.mocked(createPlaylist).mockResolvedValue({ ...ROAD_TRIP, id: 'new' });
    const onPlaylist = jest.fn();

    pick(0);
    askWhichPlaylist('Blue', () => Promise.resolve(['a']), [ROAD_TRIP], jest.fn(), onPlaylist);

    await new Promise(setImmediate);

    expect(createPlaylist).toHaveBeenCalledWith({ name: 'Blue', mediaItemIds: ['a'] });
    expect(onPlaylist).toHaveBeenCalledWith('new');
  });

  it('says so, and adds nothing, where there is nothing to add', async () => {
    pick(1);
    askWhichPlaylist('Blue', () => Promise.resolve([]), [ROAD_TRIP], jest.fn(), undefined);

    await new Promise(setImmediate);

    expect(addToPlaylist).not.toHaveBeenCalled();
    expect(alerted).toHaveBeenCalledWith('There is nothing in Blue to add.');
  });

  it('reads nothing when the sheet is cancelled', async () => {
    const songIds = jest.fn(() => Promise.resolve(['a']));

    pick(2);
    askWhichPlaylist('Blue', songIds, [ROAD_TRIP], jest.fn(), undefined);

    await new Promise(setImmediate);

    expect(songIds).not.toHaveBeenCalled();
  });
});
