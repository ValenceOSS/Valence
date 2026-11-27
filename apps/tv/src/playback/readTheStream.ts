import type { VideoPlayer } from 'expo-video';
import type { StreamReading } from '@ValenceClient/playback/describeStreamStats';

/**
 * Reads what the television's player says about the stream at this moment: where it is, how far it
 * has buffered, and the picture it is being sent.
 *
 * @param player - The video's player.
 * @returns The reading, with whatever the player does not report left empty.
 */
const readTheStream = (
  player: Pick<VideoPlayer, 'currentTime' | 'bufferedPosition' | 'videoTrack'>,
): StreamReading => {
  const track = player.videoTrack;

  return {
    positionSeconds: player.currentTime,
    bufferedSeconds: player.bufferedPosition,
    width: track?.size.width ?? null,
    height: track?.size.height ?? null,
    mimeType: track?.mimeType ?? null,
    bitrate: track?.bitrate ?? track?.averageBitrate ?? null,
    frameRate: track?.frameRate ?? null,
    range: track?.videoRange ?? null,
  };
};

export { readTheStream };
