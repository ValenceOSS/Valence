import { useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeft as ArrowLeftIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { sourceForAFile } from '@ValenceClient/downloads/keepingFiles';
import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { VideoPlayer } from '@ValenceScreens/components/VideoPlayer/VideoPlayer';

/**
 * Plays a download from this device rather than from the server, in the same player as anything
 * else, and goes back to wherever it was opened from when somebody is done.
 */
const KeptPlayerPage = () => {
  const { downloadId } = useParams({ strict: false });
  const router = useRouter();
  const held = useHeldFiles();

  const file = held.find((one) => one.downloadId === downloadId && one.state === 'here') ?? null;
  const leave = () => {
    router.history.back();
  };

  if (file === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-shade px-4">
        <p className="font-body text-sm text-text-muted">That is not on this device any more.</p>

        <Button variant="ghost" size="sm" onClick={leave}>
          <Icon of={ArrowLeftIcon} size={16} />
          Go back
        </Button>
      </main>
    );
  }

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
        onClose={leave}
        onStopped={leave}
        onProgress={(positionSeconds, durationSeconds) => {
          rememberWatchedOffline(file.mediaId, positionSeconds, durationSeconds);
        }}
      />
    </main>
  );
};

KeptPlayerPage.displayName = 'KeptPlayerPage';

export { KeptPlayerPage };
