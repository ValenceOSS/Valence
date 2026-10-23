import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { saveSubtitleLanguage } from '@ValenceClient/playback/languagePreference';
import { APlayOnSheet } from './APlayOnSheet';

jest.mock('@ValenceClient/video/useVideoDevices', () => ({ useVideoDevices: jest.fn() }));
jest.mock('@ValenceClient/video/videoDevices', () => ({
  ...jest.requireActual<object>('@ValenceClient/video/videoDevices'),
  sendVideoCommand: jest.fn(() => Promise.resolve()),
}));

const FILM = { id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', title: 'A Film' };

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(sendVideoCommand).mockClear();
  jest
    .mocked(useVideoDevices)
    .mockReturnValue([
      { clientId: 'living-room', label: 'Living room', kind: 'tv', nowWatching: null },
    ]);
});

describe('APlayOnSheet', () => {
  it('starts the title on the television chosen, from the whole second it had got to', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <APlayOnSheet media={FILM} startSeconds={754.6} onClose={onClose} />,
      {
        wrapper: CacheScope,
      },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play on Living room' }));

    expect(sendVideoCommand).toHaveBeenCalledWith('living-room', {
      kind: 'play',
      mediaId: FILM.id,
      startSeconds: 754,
      subtitleLanguage: null,
      audioLanguage: null,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('asks the television for the subtitles this phone last chose', async () => {
    saveSubtitleLanguage('fr');

    const drawn = await render(<APlayOnSheet media={FILM} startSeconds={0} onClose={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(drawn.getByRole('button', { name: 'Play on Living room' }));

    expect(sendVideoCommand).toHaveBeenCalledWith(
      'living-room',
      expect.objectContaining({ subtitleLanguage: 'fr' }),
    );
  });
});
