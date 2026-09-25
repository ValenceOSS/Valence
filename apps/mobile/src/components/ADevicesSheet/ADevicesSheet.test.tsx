import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchMusicDevices } from '@ValenceClient/music/musicDevices';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { ADevicesSheet } from './ADevicesSheet';

jest.mock('@ValenceClient/music/musicDevices', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/musicDevices'),
  fetchMusicDevices: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ADevicesSheet', () => {
  it('offers this phone and every other Valence open, and hands the music over to one', async () => {
    jest
      .mocked(fetchMusicDevices)
      .mockResolvedValue([{ clientId: 'living-room', label: 'Living room', nowPlaying: null }]);
    const handing = jest
      .spyOn(thePhonesMusicPlayer(), 'playOn')
      .mockImplementation(() => undefined);
    const onClose = jest.fn();
    const drawn = await render(<ADevicesSheet isOpen onClose={onClose} />, { wrapper: CacheScope });

    expect(drawn.getByText('This iPhone')).toBeTruthy();

    await userEvent.press(await drawn.findByRole('button', { name: 'Play on Living room' }));

    expect(handing).toHaveBeenCalledWith({ clientId: 'living-room', label: 'Living room' });
    expect(onClose).toHaveBeenCalled();
  });

  it('says where to find other devices when none are open', async () => {
    jest.mocked(fetchMusicDevices).mockResolvedValue([]);
    const drawn = await render(<ADevicesSheet isOpen onClose={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(await drawn.findByText(/No other Valence is open/u)).toBeTruthy();
  });
});
