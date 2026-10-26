import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AskForThePassword } from '@ValenceMobile/components/AskForThePassword/AskForThePassword';
import { SignedIn } from '@ValenceMobile/components/SignedIn/SignedIn';
import { TheWayIn } from '@ValenceMobile/components/TheWayIn/TheWayIn';
import { TheDownloads } from '@ValenceMobile/components/TheDownloads/TheDownloads';
import { TheListeningPlayer } from '@ValenceMobile/components/TheListeningPlayer/TheListeningPlayer';
import { TheMusicPlayer } from '@ValenceMobile/components/TheMusicPlayer/TheMusicPlayer';
import { Watching } from '@ValenceMobile/components/Watching/Watching';
import { AFaceFlight } from '@ValenceMobile/components/TheHousehold/components/AFaceFlight/AFaceFlight';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TheServerIsAway } from '@ValenceMobile/components/TheServerIsAway/TheServerIsAway';
import { useTheServer } from '@ValenceMobile/hooks/useTheServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheHouseholdProps } from './TheHousehold.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { AWayInLights } from '@ValenceMobile/components/AWayInLights/AWayInLights';

const GIVES_UP_AFTER = 500;

const styles = StyleSheet.create({
  over: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  whole: { flex: 1 },
});

/**
 * What this phone shows once it knows where its Valence is: the way in, or what is behind it.
 *
 * Which of the two is decided by asking the server rather than by remembering, so a session that
 * ended somewhere else — signed out on another device, expired, revoked by an administrator —
 * puts the wall of faces back rather than showing a screen that cannot load anything.
 *
 * Signing out says so to the cache at once rather than asking again, and throws away everything
 * that was asked while somebody was in once nothing is showing it, so nothing is asked again of a
 * session that has gone and the way in is read afresh.
 *
 * It keeps an eye on whether the server is answering at all, so that one which went quiet — while
 * somebody was signed in or before they could — picks everything up again once it is back, and
 * that while it is gone, what this phone keeps can still be watched. A server that is not
 * answering when the app opens is not waited on: asking who is signed in can hang for minutes
 * against a machine that is off, so once the server is known to be away the way in is shown,
 * saying it cannot be reached, rather than a screen that is only waiting.
 *
 * The lights behind the way in are kept lit here, under the wall and the password alike, so that
 * picking a face turns them to its colour slowly rather than cutting from one screen's lights to
 * the next; and where the face was is kept, so it can fly to the password and back. Going back, the
 * password keeps its face on screen while the wall is drawn beneath it, and goes once the wall's
 * face has taken over, so there is never a frame with neither.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 */
const TheHousehold = ({ onElsewhere }: TheHouseholdProps) => {
  const answers = useQueryClient();
  const session = useQuery(sessionQueries.who());
  const colours = useTheColours();
  const [picked, setPicked] = useState<{
    profile: ViewerProfile;
    at: ARectOnScreen | null;
  } | null>(null);
  const [returning, setReturning] = useState<{ profileId: string; at: ARectOnScreen } | null>(null);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [watchingHeld, setWatchingHeld] = useState<HeldFile | null>(null);
  const [hearingHeld, setHearingHeld] = useState<'music' | 'book' | null>(null);
  const [flight, setFlight] = useState<{
    profile: ViewerProfile;
    from: ARectOnScreen;
    to: ARectOnScreen | null;
    isOntoATile: boolean;
  } | null>(null);
  const isSignedIn = session.data !== null && session.data !== undefined;
  const wasSignedIn = useRef(isSignedIn);

  const { isAway } = useTheServer(isSignedIn ? 'besideTheSocket' : 'here');

  useEffect(() => {
    if (wasSignedIn.current && !isSignedIn) {
      answers.removeQueries({ type: 'inactive' });
    }

    if (!wasSignedIn.current && isSignedIn) {
      setPicked(null);
      setReturning(null);
    }

    wasSignedIn.current = isSignedIn;
  }, [isSignedIn, answers]);

  const faceLandsAt = useCallback((at: ARectOnScreen, isATile = false) => {
    setFlight((was) => (was === null ? null : { ...was, to: at, isOntoATile: isATile }));
  }, []);

  const faceLanded = useCallback(() => {
    setFlight(null);
  }, []);

  const backOnTheWall = useCallback(() => {
    setPicked(null);
    setIsGoingBack(false);
  }, []);

  useEffect(() => {
    if (!isGoingBack) {
      return undefined;
    }

    const givingUp = setTimeout(backOnTheWall, GIVES_UP_AFTER);

    return () => {
      clearTimeout(givingUp);
    };
  }, [isGoingBack, backOnTheWall]);

  const flying =
    flight === null ? null : (
      <AFaceFlight
        profile={flight.profile}
        from={flight.from}
        to={flight.to}
        isOntoATile={flight.isOntoATile}
        onLanded={faceLanded}
      />
    );

  if (session.isPending && !isAway) {
    return (
      <Screen centres>
        <ASpinner />
      </Screen>
    );
  }

  if (isSignedIn) {
    return (
      <View style={styles.whole}>
        <SignedIn
          onOut={() => {
            answers.setQueryData(sessionQueries.who().queryKey, null);
          }}
          onElsewhere={onElsewhere}
          onFaceAt={faceLandsAt}
          isFaceArriving={flight !== null}
        />
        <TheServerIsAway />
        {flying}
      </View>
    );
  }

  if (watchingHeld !== null) {
    return (
      <Watching
        key={watchingHeld.downloadId}
        mediaId={watchingHeld.mediaId}
        kept={watchingHeld}
        onDone={() => {
          setWatchingHeld(null);
        }}
      />
    );
  }

  if (isOffline && hearingHeld === 'book') {
    return (
      <TheListeningPlayer
        onBack={() => {
          setHearingHeld(null);
        }}
      />
    );
  }

  if (isOffline && hearingHeld === 'music') {
    return (
      <TheMusicPlayer
        onArtist={() => {}}
        onAlbum={() => {}}
        onBack={() => {
          setHearingHeld(null);
        }}
      />
    );
  }

  if (isOffline) {
    return (
      <TheDownloads
        onWatch={setWatchingHeld}
        onPlaying={setHearingHeld}
        onBack={() => {
          setIsOffline(false);
        }}
      />
    );
  }

  return (
    <View style={[styles.whole, { backgroundColor: colours.surface }]}>
      <AWayInLights profile={picked === null ? null : picked.profile} />

      {picked === null || isGoingBack ? (
        <TheWayIn
          returningFrom={returning}
          onPicked={(profile, at) => {
            setReturning(null);
            setPicked({ profile, at });
          }}
          onReturned={backOnTheWall}
          onIn={() => {
            void answers.invalidateQueries();
          }}
          onElsewhere={onElsewhere}
          onDownloads={() => {
            setIsOffline(true);
          }}
        />
      ) : null}

      {picked === null ? null : (
        <View style={isGoingBack ? styles.over : styles.whole}>
          <AskForThePassword
            profile={picked.profile}
            from={picked.at}
            isGoing={flight !== null}
            isLeaving={isGoingBack}
            onIn={(at) => {
              if (at !== null) {
                setFlight({ profile: picked.profile, from: at, to: null, isOntoATile: false });
              }

              void answers.invalidateQueries();
            }}
            onBack={(at) => {
              if (at === null) {
                setReturning(null);
                setPicked(null);

                return;
              }

              setReturning({ profileId: picked.profile.id, at });
              setIsGoingBack(true);
            }}
          />
        </View>
      )}

      {flying}
    </View>
  );
};

TheHousehold.displayName = 'TheHousehold';

export { TheHousehold };
