import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { createPlaylist, updatePlaylist } from '@ValenceClient/music/fetchPlaylists';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { APlaylistDetails } from './APlaylistDetails';

jest.mock('@ValenceClient/music/fetchPlaylists');

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('APlaylistDetails', () => {
  it('makes a new playlist with the name given, and opens it', async () => {
    jest
      .mocked(createPlaylist)
      .mockResolvedValue(aPlaylist({ id: '00000000-0000-4000-8000-0000000000bb' }));
    const onDone = jest.fn();
    const drawn = await render(
      <APlaylistDetails isOpen editing={null} onClose={jest.fn()} onDone={onDone} />,
      { wrapper: CacheScope },
    );

    await userEvent.type(drawn.getByLabelText('Name'), 'Late nights');
    await userEvent.press(drawn.getByText('Make it'));

    expect(createPlaylist).toHaveBeenCalledWith(expect.objectContaining({ name: 'Late nights' }));
    expect(onDone).toHaveBeenCalledWith('00000000-0000-4000-8000-0000000000bb');
  });

  it('saves changes to a playlist being edited', async () => {
    jest.mocked(updatePlaylist).mockResolvedValue(true);
    const onDone = jest.fn();
    const drawn = await render(
      <APlaylistDetails isOpen editing={aPlaylist()} onClose={jest.fn()} onDone={onDone} />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Edit playlist')).toBeTruthy();

    await userEvent.press(drawn.getByText('Save'));

    expect(onDone).toHaveBeenCalledWith(aPlaylist().id);
  });
});
