import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { APlayOnATelevision } from './APlayOnATelevision';

jest.mock('@ValenceClient/video/useVideoDevices', () => ({ useVideoDevices: jest.fn() }));
jest.mock('@ValenceClient/video/videoDevices', () => ({
  ...jest.requireActual<object>('@ValenceClient/video/videoDevices'),
  sendVideoCommand: jest.fn(() => Promise.resolve(true)),
}));

const FILM = { id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', title: 'A Film' };

const LIVING_ROOM = {
  clientId: 'living-room',
  label: 'Valence on Living Room TV',
  kind: 'tv' as const,
  nowWatching: null,
};

const BEDROOM = { ...LIVING_ROOM, clientId: 'bedroom', label: 'Valence on Bedroom TV' };

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(sendVideoCommand).mockClear();
});

describe('APlayOnATelevision', () => {
  it('names the one television and starts the title on it straight away', async () => {
    jest.mocked(useVideoDevices).mockReturnValue([LIVING_ROOM]);
    const onSent = jest.fn();
    const drawn = await render(
      <APlayOnATelevision media={FILM} startSeconds={60.4} onSent={onSent} />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play on Valence on Living Room TV' }));

    expect(sendVideoCommand).toHaveBeenCalledWith('living-room', {
      kind: 'play',
      mediaId: FILM.id,
      startSeconds: 60,
      subtitleLanguage: null,
      audioLanguage: null,
    });
    expect(onSent).toHaveBeenCalled();
  });

  it('offers the televisions to choose from where there are several', async () => {
    jest.mocked(useVideoDevices).mockReturnValue([LIVING_ROOM, BEDROOM]);
    const onSent = jest.fn();
    const drawn = await render(
      <APlayOnATelevision media={FILM} startSeconds={0} onSent={onSent} />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play on TV' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Play on Valence on Bedroom TV' }));

    expect(sendVideoCommand).toHaveBeenCalledWith(
      'bedroom',
      expect.objectContaining({ kind: 'play', mediaId: FILM.id }),
    );
    expect(onSent).toHaveBeenCalled();
  });

  it('shows nothing where there is no television', async () => {
    jest
      .mocked(useVideoDevices)
      .mockReturnValue([{ ...LIVING_ROOM, clientId: 'laptop', label: 'Safari', kind: 'browser' }]);
    const drawn = await render(
      <APlayOnATelevision media={FILM} startSeconds={0} onSent={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.queryByRole('button')).toBeNull();
  });
});
