import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { OfflinePlayer } from '@ValenceScreens/components/OfflinePlayer/OfflinePlayer';
import type { PlayingAKeptFileProps } from './PlayingAKeptFile.types';

/**
 * Plays a file kept on this device from where it was last left, and remembers where it gets to,
 * whether or not the server is there to be told.
 *
 * @param file - What to play.
 * @param onLeave - Told when somebody is done with it.
 */
const PlayingAKeptFile = ({ file, onLeave }: PlayingAKeptFileProps) => {
  const gotTo = watchedOffline().find((entry) => entry.mediaId === file.mediaId);

  return (
    <OfflinePlayer
      file={file}
      {...(gotTo === undefined ? {} : { startAtSeconds: gotTo.positionSeconds })}
      onLeave={onLeave}
      onProgress={(positionSeconds, durationSeconds) => {
        rememberWatchedOffline(file.mediaId, positionSeconds, durationSeconds);
      }}
    />
  );
};

PlayingAKeptFile.displayName = 'PlayingAKeptFile';

export { PlayingAKeptFile };
