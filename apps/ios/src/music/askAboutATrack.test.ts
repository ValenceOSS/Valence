import { ActionSheetIOS } from 'react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { askAboutATrack } from './askAboutATrack';

const asking = (picked: number) =>
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_, told) => {
    told(picked);
  });

const aQuestion = (overrides: Partial<Parameters<typeof askAboutATrack>[0]> = {}) => ({
  track: aTrack(1),
  player: thePhonesMusicPlayer(),
  isLiked: false,
  onLike: jest.fn(),
  onAlbum: jest.fn(),
  onArtist: jest.fn(),
  playlists: [],
  onPlaylistsChanged: jest.fn(),
  ...overrides,
});

describe('askAboutATrack', () => {
  it('plays the song next when asked', () => {
    const playingNext = jest.spyOn(thePhonesMusicPlayer(), 'playNext');

    asking(0);
    askAboutATrack(aQuestion());

    expect(playingNext).toHaveBeenCalledWith([aTrack(1)]);
  });

  it('goes to the album and the artist', () => {
    const question = aQuestion();

    asking(4);
    askAboutATrack(question);
    asking(5);
    askAboutATrack(question);

    expect(question.onAlbum).toHaveBeenCalledWith(aTrack(1).album.id);
    expect(question.onArtist).toHaveBeenCalledWith(aTrack(1).artists[0]?.id);
  });

  it('offers moving and removing only inside a playlist, and says removing is final', () => {
    const shown = asking(99);

    askAboutATrack(
      aQuestion({
        inAPlaylist: {
          canMoveUp: false,
          canMoveDown: true,
          onMoveUp: jest.fn(),
          onMoveDown: jest.fn(),
          onRemove: jest.fn(),
        },
      }),
    );

    const options = shown.mock.calls.at(-1)?.[0];

    expect(options?.options).toContain('Move down');
    expect(options?.options).not.toContain('Move up');
    expect(options?.destructiveButtonIndex).toBe(
      options?.options.indexOf('Remove from this playlist'),
    );
  });
});
