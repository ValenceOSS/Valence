import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { placeToCarryOnFrom } from '@ValenceClient/offline/placeToCarryOnFrom';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { VideoPlayer } from '@ValenceScreens/components/VideoPlayer/VideoPlayer';
import type { PlayingAKeptFileProps } from './PlayingAKeptFile.types';

/**
 * Plays a file kept on this device in the same player as anything else, and remembers where it gets
 * to whether or not the server is there to be told.
 *
 * It carries on from whichever is newer, where it got to on this device or where the server says
 * this profile got to, perhaps on another device since. While the server is being asked, it waits for
 * the answer; with no server to ask, it carries on from this device's place.
 *
 * @param file - What to play.
 * @param onLeave - Told when somebody is done with it.
 */
const PlayingAKeptFile = ({ file, onLeave }: PlayingAKeptFileProps) => {
  const cache = useQueryClient();
  const watcher = cache.getQueryData(profileQueries.watching().queryKey)?.id ?? null;
  const progress = useQuery(viewingQueries.progress());

  if (progress.isPending && progress.fetchStatus === 'fetching') {
    return null;
  }

  const startAt = placeToCarryOnFrom(
    watchedOffline(watcher).find((entry) => entry.mediaId === file.mediaId),
    progress.data?.find((entry) => entry.mediaId === file.mediaId),
  );

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
        keptDownloadId={file.downloadId}
        startSeconds={startAt ?? 0}
        isImmersive
        onClose={onLeave}
        onProgress={(positionSeconds, durationSeconds) => {
          rememberWatchedOffline(file.mediaId, positionSeconds, durationSeconds, watcher);
        }}
      />
    </main>
  );
};

PlayingAKeptFile.displayName = 'PlayingAKeptFile';

export { PlayingAKeptFile };
