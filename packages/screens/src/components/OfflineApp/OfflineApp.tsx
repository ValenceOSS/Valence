import { useState } from 'react';
import {
  CloudOff as CloudOffIcon,
  Server as ServerIcon,
  Wifi as WifiIcon,
} from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { NavBar } from '@ValenceUI/NavBar';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import { dropAFile, pauseAFile } from '@ValenceClient/downloads/keepingFiles';
import { PlayingAKeptFile } from '@ValenceScreens/components/PlayingAKeptFile/PlayingAKeptFile';
import { OfflineShelf } from '@ValenceScreens/components/OfflineShelf/OfflineShelf';
import {
  askForADifferentServer,
  isTheDesktopClient,
} from '@ValenceScreens/desktop/theDesktopShell';
import type { OfflineAppProps } from './OfflineApp.types';

/**
 * Valence with no server: what is on this machine, and something to play it with.
 *
 * A deliberately smaller application rather than the ordinary one with its failures hidden. Nothing
 * here asks the server anything, because there is nothing to ask — no library, no search, no
 * account, no admin, no other profiles. Every one of those would have to be either faked from a
 * stale cache or drawn as an apology, and a screen that half-works is a worse thing to hand somebody
 * than one that was never offered.
 *
 * Going back is always offered where the server is answering again, and never taken automatically
 * from somebody who asked to be offline. Somebody who went offline on purpose an hour before a
 * flight has not changed their mind by walking past a working connection.
 *
 * Where somebody got to is remembered here and picked up from here, because there is nowhere else to
 * remember it. Watching half of something, closing the lid and opening it again is the ordinary way
 * a film gets watched on a journey, and the server that would usually keep the bookmark is the one
 * thing that is missing.
 *
 * @param title - What this instance is called.
 */
const OfflineApp = ({ title }: OfflineAppProps) => {
  const held = useHeldFiles();
  const { isReachable, isByChoice, goOffline } = useOfflineMode();

  const [watching, setWatching] = useState<string | null>(null);

  const playing = held.find((file) => file.downloadId === watching) ?? null;

  if (playing !== null) {
    return (
      <PlayingAKeptFile
        file={playing}
        onLeave={() => {
          setWatching(null);
        }}
      />
    );
  }

  return (
    <>
      <NavBar
        brand={
          <span className="flex items-center gap-2.5">
            <Logo size={28} isSolid />

            <span className="hidden font-sans text-xl font-medium tracking-tight text-text sm:inline">
              {title}
            </span>
          </span>
        }
        items={[]}
        selectedId=""
        onSelect={() => {}}
        trailing={
          <>
            <Badge size="sm" tone="quiet">
              <Icon of={CloudOffIcon} size={14} />
              Offline
            </Badge>

            {!isTheDesktopClient() ? null : (
              <Button
                variant={isReachable ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => {
                  void askForADifferentServer();
                }}
              >
                <Icon of={ServerIcon} size={15} />
                Change server
              </Button>
            )}

            {!isReachable ? null : (
              <Button
                variant="glossy"
                size="sm"
                onClick={() => {
                  goOffline(false);
                }}
              >
                <Icon of={WifiIcon} size={15} />
                {isByChoice ? 'Go back online' : 'Reconnect'}
              </Button>
            )}
          </>
        }
      />

      <main className="flex min-h-screen flex-col gap-10 px-4 pb-16 pt-28 sm:px-6">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-text">
            On this device
          </h1>

          <p className="font-body text-sm text-text-muted">
            {isReachable
              ? 'You are offline because you asked to be, so only what is on this device is shown.'
              : 'Valence cannot be reached, so only what is on this device is shown.'}
          </p>
        </header>

        <OfflineShelf
          held={held}
          onWatch={(file) => {
            setWatching(file.downloadId);
          }}
          onDrop={(file) => {
            void dropAFile(file.downloadId);
          }}
          onPause={(file, isPaused) => {
            void pauseAFile(file.downloadId, isPaused);
          }}
        />
      </main>
    </>
  );
};

OfflineApp.displayName = 'OfflineApp';

export { OfflineApp };
