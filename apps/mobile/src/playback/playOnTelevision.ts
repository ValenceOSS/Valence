import { controlDevice } from '@ValenceClient/video/controlledDevice';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import {
  readAudioLanguage,
  readSubtitleLanguage,
} from '@ValenceClient/playback/languagePreference';
import type { ControlledDevice } from '@ValenceClient/video/controlledDevice';

/**
 * Starts a title on one of this person's televisions, from the whole second it had got to, in the
 * soundtrack and subtitles this phone last chose, and makes this phone that television's remote.
 *
 * @param device - The television.
 * @param mediaId - The title.
 * @param startSeconds - Where to start it.
 */
const playOnTelevision = (
  device: ControlledDevice,
  mediaId: string,
  startSeconds: number,
): void => {
  void sendVideoCommand(device.clientId, {
    kind: 'play',
    mediaId,
    startSeconds: Math.floor(startSeconds),
    subtitleLanguage: readSubtitleLanguage(),
    audioLanguage: readAudioLanguage(),
  });
  controlDevice({ clientId: device.clientId, label: device.label });
};

export { playOnTelevision };
