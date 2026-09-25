import { sourceForAFile } from '@ValenceClient/downloads/keepingFiles';
import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { VideoPlayer } from '@ValenceScreens/components/VideoPlayer/VideoPlayer';
import type { PlayingAKeptFileProps } from './PlayingAKeptFile.types';

/**
 * Plays a file kept on this device in the same player as anything else, from where it was last
 * left, and remembers where it gets to whether or not the server is there to be told.
 *
 * @param file - What to play.
 * @param onLeave - Told when somebody is done with it.
 */
const PlayingAKeptFile = ({ file, onLeave }: PlayingAKeptFileProps) => {
  const gotTo = watchedOffline().find((entry) => entry.mediaId === file.mediaId);

  return (
    <main className="valence-below-the-bar z-40 flex flex-col bg-shade">
      <VideoPlayer
        media={{
          id: file.mediaId,
          title: file.title,
          durationSeconds: file.durationSeconds ?? 0,
          seriesTitle: file.seriesTitle,
          hasPoster: file.hasPoster,
        }}
        keptSource={sourceForAFile(file.downloadId)}
        startSeconds={gotTo?.positionSeconds ?? 0}
        isImmersive
        onClose={onLeave}
        onStopped={onLeave}
        onProgress={(positionSeconds, durationSeconds) => {
          rememberWatchedOffline(file.mediaId, positionSeconds, durationSeconds);
        }}
      />
    </main>
  );
};

PlayingAKeptFile.displayName = 'PlayingAKeptFile';

export { PlayingAKeptFile };
