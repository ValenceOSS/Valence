import { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { buildRouter } from '@ValenceScreens/routes/buildRouter';
import { ConnectToServer } from '@ValenceScreens/components/ConnectToServer/ConnectToServer';
import { useAppliedTheme } from '@ValenceScreens/theme/useAppliedTheme';
import { WindowBar } from '@ValenceScreens/components/WindowBar/WindowBar';
import { useHistoryWays } from '@ValenceScreens/desktop/useHistoryWays';
import { useHistoryKeys } from '@ValenceScreens/desktop/useHistoryKeys';
import { historyKeysFor } from '@ValenceScreens/desktop/historyKeysFor';
import { useTheInbox } from '@ValenceScreens/notifications/useTheInbox';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { useIsWatching } from '@ValenceScreens/playback/useIsWatching';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';
import {
  recentServerAddresses,
  rememberServerAddress,
  serverAddress,
} from '@ValenceClient/session/serverAddress';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import { useServerIsLost } from '@ValenceClient/offline/useServerIsLost';
import '@ValenceDesktop/TheWindow.types';
import { say } from '@ValenceI18n/say';

const router = buildRouter(say('common.valence'));

const ASKED_ABOUT = 'valence.update.askedAbout';

/**
 * Valence, drawn by this client rather than fetched from a server as pages.
 *
 * The application is a package and this is a host for it — the same one the browser is, with
 * different answers to the four things a host is asked: where preferences live, what to call this
 * client, which client this is, and how to open a socket. Everything above that is the same code
 * running in both places.
 *
 * What a server is asked for goes out on this client's own origin and is passed on by the process
 * that owns the window. So nothing here is cross-origin, no cookie is dropped for being somebody
 * else's, and signing in is an ordinary request rather than a negotiation between two origins.
 *
 * The strip along the top is this client's too, and for the same reason: a browser gives a window
 * somewhere to be picked up by and a frameless one has nowhere. It lies over the page rather than
 * above it, so no screen pays height for a bar it never sees, and once a server has been chosen it
 * carries back and forward, by button and by key, and the inbox the dock would otherwise hold.
 *
 * A new release is offered rather than fetched. Somebody is asked once per version whether they want
 * it — never while a film has the window, since the question can wait for the credits — and the
 * strip keeps a way to fetch it for anybody who said not now. Saying yes, in either place, fetches
 * it and restarts into it.
 *
 * The one screen this client owns is the first one: which Valence is yours. It has to be ours, because
 * until it is answered there is no server to ask anything of. Nothing else is drawn until it is
 * answered — a client with no server has no library, no account and no downloads, and the shelf of
 * downloads in particular is an empty room on a machine that has never been given anywhere to fetch
 * from. What it offers on that screen is found by the process that owns the window — a page served
 * from a scheme of its own cannot go knocking on `localhost` to see what answers, and would be
 * refused for being somebody else's origin. The same process hears the servers that announce
 * themselves on the network, which a page has no socket to hear with either. Where nothing is found
 * it is the same screen with the box alone, because somebody whose server is elsewhere still has to
 * be asked — though what they were pointed at before is offered too, being on this device already.
 *
 * An address that no longer answers is asked about again, but only where there is nothing on this
 * device. Offline mode is built around a shelf of downloads, and offering it an empty shelf is
 * showing somebody an empty room and calling it a feature — the honest question at that point is
 * where Valence went, not which of the nothing they would like to watch. Somebody who does have
 * downloads keeps them, because a laptop on a plane has not mistyped its address.
 *
 * That question is followed rather than asked once. A client that has made no request yet has no
 * grounds to call its server missing, so it starts out assuming one is there and learns otherwise
 * from the first request that fails — which is after this has been drawn. Reading it as the window
 * opens therefore only ever read back the assumption, and an address that was dead all along drew
 * the empty shelf anyway.
 *
 * Whoever is asked again is shown the address that stopped answering rather than an empty box. They
 * came here to correct a detail or to wait for a machine to come back, not to remember what they
 * typed months ago.
 *
 * The chosen theme is put on the document from here as well as from the application's own root,
 * because the screen this client owns is drawn instead of that root rather than inside it.
 */
const Desktop = () => {
  const [server, setServer] = useState(serverAddress());
  const [found, setFound] = useState<readonly string[]>(
    () => window.valence.servers?.alreadyFound ?? [],
  );
  const [nearby, setNearby] = useState<readonly NearbyValence[]>(
    () => window.valence.servers?.alreadyNearby ?? [],
  );
  const [recent] = useState(recentServerAddresses);
  const [update, setUpdate] = useState<DesktopUpdate>(() => window.valence.update.now());
  const [askedAbout, setAskedAbout] = useState(() => platformInUse().store.read(ASKED_ABOUT));
  const isWatching = useIsWatching();
  const isLost = useServerIsLost();
  const ways = useHistoryWays(router.history);
  const platform = document.documentElement.dataset['valencePlatform'];

  useAppliedTheme();

  useEffect(
    () =>
      window.valence.servers?.whenFound((address) => {
        setFound((was) => (was.includes(address) ? was : [...was, address]));
      }),
    [],
  );

  useEffect(() => window.valence.servers?.whenNearbyChanges(setNearby), []);

  useEffect(() => window.valence.update.whenChanged(setUpdate), []);

  const answered = (version: string): void => {
    platformInUse().store.write(ASKED_ABOUT, version);
    setAskedAbout(version);
  };

  const isAsking = update.kind === 'available' && update.version !== askedAbout && !isWatching;

  const chosen = server === null || server === '' ? null : server;
  const isInside = chosen !== null && !isLost;
  const who = useQuery({ ...sessionQueries.who(), enabled: isInside });
  const inbox = useTheInbox(isInside && who.data !== null && who.data !== undefined);

  useHistoryKeys(ways, platform);

  return (
    <>
      <WindowBar
        update={update}
        onUpdate={() => {
          window.valence.update.download();
        }}
        {...(isInside ? { ways, keys: historyKeysFor(platform) } : {})}
        {...(isInside && who.data !== null && who.data !== undefined ? { inbox } : {})}
        onHelp={() => {
          window.open(DOCS_ADDRESS, '_blank', 'noopener,noreferrer');
        }}
      />

      <ConfirmDialog
        title={say('desktop.desktop.updateValence')}
        detail={
          update.kind === 'available'
            ? say('desktop.desktop.valenceVersionIsOutItDownloads', { version: update.version })
            : ''
        }
        confirmLabel={say('desktop.desktop.update')}
        dismissLabel={say('common.notNow')}
        isOpen={isAsking}
        onClose={() => {
          if (update.kind === 'available') {
            answered(update.version);
          }
        }}
        onConfirm={() => {
          if (update.kind === 'available') {
            answered(update.version);
          }

          window.valence.update.download();
        }}
      />

      {chosen === null || isLost ? (
        <ConnectToServer
          found={found}
          nearby={nearby}
          recent={recent}
          build={describeTheBuild(theBuildInfo(), null)}
          {...(window.valence.servers === undefined ? {} : { reach: window.valence.servers.reach })}
          {...(chosen === null ? {} : { startWith: chosen, couldNotReach: chosen })}
          onConnected={(address) => {
            rememberServerAddress(address);
            setServer(address);
          }}
        />
      ) : (
        <RouterProvider router={router} />
      )}
    </>
  );
};

Desktop.displayName = 'Desktop';

export { Desktop };
