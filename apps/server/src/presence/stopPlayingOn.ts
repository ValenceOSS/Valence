import type { BookDevices } from '@ValenceServer/books/createBookDevices';
import type { MusicServices } from '@ValenceServer/music/MusicServices';
import type { PlaybackService } from '@ValenceServer/playback/PlaybackService';

type Players = {
  playback: Pick<PlaybackService, 'stop'>;
  music?: { devices: Pick<MusicServices['devices'], 'order'> } | undefined;
  bookDevices?: Pick<BookDevices, 'order'> | undefined;
};

/**
 * Stops whatever an open tab is playing: tells it to stop its music or its audiobook where it is
 * playing one, and otherwise ends the stream being converted for it.
 *
 * @param players - What plays music, audiobooks and video.
 * @param clientId - The open tab.
 * @param transcoderSessionId - The stream being converted for it, if any.
 * @returns Whether it was music or an audiobook, which the tab stops itself.
 */
const stopPlayingOn = async (
  { playback, music, bookDevices }: Players,
  clientId: string,
  transcoderSessionId: string | null,
): Promise<boolean> => {
  if (
    music?.devices.order(clientId, { kind: 'stop' }) === true ||
    bookDevices?.order(clientId, 'stop') === true
  ) {
    return true;
  }

  if (transcoderSessionId !== null) {
    await playback.stop(transcoderSessionId, clientId);
  }

  return false;
};

export { stopPlayingOn };
