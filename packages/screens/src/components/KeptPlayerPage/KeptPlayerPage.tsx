import { useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeft as ArrowLeftIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { PlayingAKeptFile } from '@ValenceScreens/components/PlayingAKeptFile/PlayingAKeptFile';

/**
 * Plays a download from this device rather than from the server, which is what having it here is
 * for, and goes back to wherever it was opened from when somebody is done.
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

  return <PlayingAKeptFile file={file} onLeave={leave} />;
};

KeptPlayerPage.displayName = 'KeptPlayerPage';

export { KeptPlayerPage };
