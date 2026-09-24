import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AskForThePassword } from '@ValencePhone/components/AskForThePassword/AskForThePassword';
import { SignedIn } from '@ValencePhone/components/SignedIn/SignedIn';
import { TheWayIn } from '@ValencePhone/components/TheWayIn/TheWayIn';
import { TheDownloads } from '@ValencePhone/components/TheDownloads/TheDownloads';
import { WatchingHeld } from '@ValencePhone/components/WatchingHeld/WatchingHeld';
import { AMoodBackground } from '@ValencePhone/components/AMoodBackground/AMoodBackground';
import { thePictureFor } from '@ValencePhone/components/AFace/thePictureFor';
import { AFaceFlight } from '@ValencePhone/components/TheHousehold/components/AFaceFlight/AFaceFlight';
import { usePictureLights } from '@ValencePhone/hooks/usePictureLights';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TheServerIsAway } from '@ValencePhone/components/TheServerIsAway/TheServerIsAway';
import { useTheServer } from '@ValencePhone/hooks/useTheServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheHouseholdProps } from './TheHousehold.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

const styles = StyleSheet.create({
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
 * that while it is gone, what this phone keeps can still be watched.
 *
 * The lights behind the way in are kept lit here, under the wall and the password alike, so that
 * picking a face turns them to its colour slowly rather than cutting from one screen's lights to
 * the next; and where the face was is kept, so it can fly to the password and back.
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
  const [isOffline, setIsOffline] = useState(false);
  const [watchingHeld, setWatchingHeld] = useState<HeldFile | null>(null);
  const [flight, setFlight] = useState<{
    profile: ViewerProfile;
    from: ARectOnScreen;
    to: ARectOnScreen | null;
  } | null>(null);
  const lights = usePictureLights(
    picked === null ? null : (thePictureFor(picked.profile)?.uri ?? null),
  );
  const isSignedIn = session.data !== null && session.data !== undefined;
  const wasSignedIn = useRef(isSignedIn);

  useTheServer(isSignedIn ? 'beside the socket' : 'here');

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

  const faceLandsAt = useCallback((at: ARectOnScreen) => {
    setFlight((was) => (was === null ? null : { ...was, to: at }));
  }, []);

  const faceLanded = useCallback(() => {
    setFlight(null);
  }, []);

  const flying =
    flight === null ? null : (
      <AFaceFlight
        profile={flight.profile}
        from={flight.from}
        to={flight.to}
        onLanded={faceLanded}
      />
    );

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
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
        />
        <TheServerIsAway />
        {flying}
      </View>
    );
  }

  if (watchingHeld !== null) {
    return (
      <WatchingHeld
        file={watchingHeld}
        onDone={() => {
          setWatchingHeld(null);
        }}
      />
    );
  }

  if (isOffline) {
    return (
      <TheDownloads
        onWatch={setWatchingHeld}
        onBack={() => {
          setIsOffline(false);
        }}
      />
    );
  }

  return (
    <View style={[styles.whole, { backgroundColor: colours.surface }]}>
      {lights.length > 0 ? (
        <AMoodBackground palette={lights} />
      ) : (
        <AMoodBackground lights={picked === null ? [] : [picked.profile.colour]} />
      )}

      {picked === null ? (
        <TheWayIn
          returningFrom={returning}
          onPicked={(profile, at) => {
            setReturning(null);
            setPicked({ profile, at });
          }}
          onIn={() => {
            void answers.invalidateQueries();
          }}
          onElsewhere={onElsewhere}
          onDownloads={() => {
            setIsOffline(true);
          }}
        />
      ) : (
        <AskForThePassword
          profile={picked.profile}
          from={picked.at}
          isGoing={flight !== null}
          onIn={(at) => {
            if (at !== null) {
              setFlight({ profile: picked.profile, from: at, to: null });
            }

            void answers.invalidateQueries();
          }}
          onBack={(at) => {
            setReturning(at === null ? null : { profileId: picked.profile.id, at });
            setPicked(null);
          }}
        />
      )}

      {flying}
    </View>
  );
};

TheHousehold.displayName = 'TheHousehold';

export { TheHousehold };
