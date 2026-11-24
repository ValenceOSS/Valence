import { useEffect, useState } from 'react';
import type { VideoPlayer } from 'expo-video';
import { readTheStream } from '@ValenceTv/playback/readTheStream';
import type { StreamReading } from '@ValenceClient/playback/describeStreamStats';

const READ_EVERY_MS = 1000;

const READINGS_KEPT = 60;

const NOTHING_READ: StreamReading = {
  positionSeconds: 0,
  bufferedSeconds: 0,
  width: null,
  height: null,
  mimeType: null,
  bitrate: null,
  frameRate: null,
  range: null,
};

const NO_HISTORY: readonly StreamReading[] = [];

/**
 * Reads the player once a second while somebody is looking at the stream's statistics, keeping the
 * last minute of readings for the charts, and nothing at all while nobody is.
 *
 * @param player - The video's player.
 * @param isReading - Whether the statistics are showing.
 * @returns The newest reading, and the last minute of them, oldest first.
 */
const useStreamReadings = (
  player: Pick<VideoPlayer, 'currentTime' | 'bufferedPosition' | 'videoTrack'>,
  isReading: boolean,
): { reading: StreamReading; history: readonly StreamReading[] } => {
  const [history, setHistory] = useState<readonly StreamReading[]>(NO_HISTORY);

  useEffect(() => {
    if (!isReading) {
      setHistory(NO_HISTORY);

      return;
    }

    const read = () => {
      const reading = readTheStream(player);

      setHistory((had) => [...had, reading].slice(-READINGS_KEPT));
    };

    read();

    const timer = setInterval(read, READ_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isReading, player]);

  return { reading: history.at(-1) ?? NOTHING_READ, history };
};

export { useStreamReadings };
