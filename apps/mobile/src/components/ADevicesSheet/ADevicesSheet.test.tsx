import { render, userEvent, waitFor } from '@testing-library/react-native';
import GoogleCast from 'react-native-google-cast';
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
    jest.mocked(fetchMusicDevices).mockResolvedValue([
      {
        clientId: 'living-room',
        label: 'Living room',
        clientKind: null,
        nowPlaying: null,
        ageMs: null,
      },
    ]);
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

    expect(await drawn.findByText(/Valence isn’t open on any other device/u)).toBeTruthy();
  });

  it('offers a Chromecast on the network, and opens the list of them to send the music to one', async () => {
    jest.mocked(fetchMusicDevices).mockResolvedValue([]);
    const opening = jest.spyOn(GoogleCast, 'showCastDialog');
    const drawn = await render(<ADevicesSheet isOpen onClose={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(drawn.getByRole('button', { name: 'Chromecast' }));

    await waitFor(() => {
      expect(opening).toHaveBeenCalled();
    });
  });
});
