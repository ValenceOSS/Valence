import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { controlDevice, readControlledDevice } from '@ValenceClient/video/controlledDevice';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import {
  saveAudioLanguage,
  saveSubtitleLanguage,
} from '@ValenceClient/playback/languagePreference';
import { playOnTelevision } from '@ValenceMobile/playback/playOnTelevision';

jest.mock('@ValenceClient/video/videoDevices', () => ({
  sendVideoCommand: jest.fn(() => Promise.resolve(true)),
}));

const FILM = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(sendVideoCommand).mockClear();
  controlDevice(null);
});

describe('playOnTelevision', () => {
  it('starts the title on the television from the whole second it had got to, and becomes its remote', () => {
    playOnTelevision({ clientId: 'living-room', label: 'Living room' }, FILM, 754.6);

    expect(sendVideoCommand).toHaveBeenCalledWith('living-room', {
      kind: 'play',
      mediaId: FILM,
      startSeconds: 754,
      subtitleLanguage: null,
      audioLanguage: null,
    });
    expect(readControlledDevice()).toEqual({ clientId: 'living-room', label: 'Living room' });
  });

  it('asks for the soundtrack and subtitles this phone last chose', () => {
    saveSubtitleLanguage('fr');
    saveAudioLanguage('ja');

    playOnTelevision({ clientId: 'living-room', label: 'Living room' }, FILM, 0);

    expect(sendVideoCommand).toHaveBeenCalledWith(
      'living-room',
      expect.objectContaining({ subtitleLanguage: 'fr', audioLanguage: 'ja' }),
    );
  });
});
