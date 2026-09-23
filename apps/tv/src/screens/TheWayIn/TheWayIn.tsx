import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { rememberServerAddress, serverAddress } from '@ValenceClient/session/serverAddress';
import { theSessionToken } from '@ValenceTv/platform/theSessionToken';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { signOutHere } from '@ValenceTv/session/signOutHere';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { Face } from '@ValenceTv/components/Face/Face';
import { Flight } from '@ValenceTv/components/Flight/Flight';
import { Splash } from '@ValenceTv/components/Splash/Splash';
import { ChooseServer } from '@ValenceTv/screens/ChooseServer/ChooseServer';
import { EnterPassword } from '@ValenceTv/screens/EnterPassword/EnterPassword';
import { WhoIsWatching } from '@ValenceTv/screens/WhoIsWatching/WhoIsWatching';
import { SignedIn } from '@ValenceTv/screens/SignedIn/SignedIn';
import { tokens } from '@ValenceTv/theme/tokens';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { Leaving, Spot } from '@ValenceTv/components/Flight/Flight.types';

const SPLASH_LINGERS_MS = 700;

type Leg = { from: Spot; to: Spot | null };

type Flights = { profile: ViewerProfile; face: Leg | null; mark: Leg | null };

type Step = { kind: 'faces' } | { kind: 'password'; profile: ViewerProfile };

/**
 * The way in to Valence on a television: which server, who is watching, and their password or their
 * phone — and then everything else, once somebody is in.
 *
 * The face somebody picks, and Valence's mark with it, fly into place on the PIN screen, and on from
 * there into the bar once they are in, as they do on the web and the desktop app.
 *
 * Opening the app shows Valence's splash, carried on from the television's launch screen, until it
 * is known who is signed in, and for long enough not to flash past.
 *
 * Nothing is drawn behind the question being asked. A television with no server has nothing to show,
 * and one with nobody signed in has no library to show them.
 *
 * Somebody still signed in whose session token was not kept — the television's secure store can
 * refuse it — has it read back from the session, since the video player cannot sign its requests
 * any other way.
 */
const TheWayIn = () => {
  const cache = useQueryClient();
  const [server, setServer] = useState(serverAddress);
  const [step, setStep] = useState<Step>({ kind: 'faces' });
  const [flights, setFlights] = useState<Flights | null>(null);
  const [hasLingered, setHasLingered] = useState(false);
  const [isSplashGone, setIsSplashGone] = useState(false);

  useEffect(() => {
    const lingering = setTimeout(() => {
      setHasLingered(true);
    }, SPLASH_LINGERS_MS);

    return () => {
      clearTimeout(lingering);
    };
  }, []);

  const splashGone = useCallback(() => {
    setIsSplashGone(true);
  }, []);

  const takeOff = useCallback((profile: ViewerProfile, from: Leaving) => {
    setFlights({
      profile,
      face: from.face === null ? null : { from: from.face, to: null },
      mark: from.mark === null ? null : { from: from.mark, to: null },
    });
  }, []);

  const landFace = useCallback((at: Spot) => {
    setFlights((was) =>
      was === null || was.face === null || was.face.to !== null
        ? was
        : { ...was, face: { ...was.face, to: at } },
    );
  }, []);

  const landMark = useCallback((at: Spot) => {
    setFlights((was) =>
      was === null || was.mark === null || was.mark.to !== null
        ? was
        : { ...was, mark: { ...was.mark, to: at } },
    );
  }, []);

  const faceLanded = useCallback(() => {
    setFlights((was) => (was === null || was.mark === null ? null : { ...was, face: null }));
  }, []);

  const markLanded = useCallback(() => {
    setFlights((was) => (was === null || was.face === null ? null : { ...was, mark: null }));
  }, []);
  const session = useQuery({ ...sessionQueries.who(), enabled: server !== null });

  const toFaces = useCallback(() => {
    setStep({ kind: 'faces' });
  }, []);

  const signedIn = useCallback(() => {
    setStep({ kind: 'faces' });
    void cache.invalidateQueries();
  }, [cache]);

  const changeServer = useCallback(() => {
    void signOutHere().finally(() => {
      rememberServerAddress(null);
      cache.clear();
      setServer(null);
    });
  }, [cache]);

  useMenuButton(server !== null && session.data === null && step.kind !== 'faces' ? toFaces : null);

  const isSignedIn = session.data !== undefined && session.data !== null;

  useEffect(() => {
    if (isSignedIn && theSessionToken() === null) {
      void holdTheSession();
    }
  }, [isSignedIn]);

  const page = (): ReactNode => {
    if (server === null) {
      return (
        <ChooseServer
          onChosen={(address) => {
            rememberServerAddress(address);
            cache.clear();
            setServer(address);
          }}
        />
      );
    }

    if (session.isPending) {
      return (
        <View style={styles.waiting}>
          <ActivityIndicator size="large" color={tokens.colours.text} />
        </View>
      );
    }

    if (session.isError) {
      return (
        <ChooseServer
          couldNotReach={server}
          onChosen={(address) => {
            rememberServerAddress(address);
            cache.clear();
            setServer(address);
          }}
        />
      );
    }

    if (session.data !== null) {
      return (
        <SignedIn
          user={session.data}
          onChangeServer={changeServer}
          isArriving={flights !== null}
          onFaceAt={landFace}
          onMarkAt={landMark}
        />
      );
    }

    if (step.kind === 'password') {
      const { profile } = step;

      return (
        <EnterPassword
          profile={profile}
          onSignedIn={(from) => {
            takeOff(profile, from);
            signedIn();
          }}
          onBack={toFaces}
          isArriving={flights !== null}
          onFaceAt={landFace}
          onMarkAt={landMark}
        />
      );
    }

    return (
      <WhoIsWatching
        onChoose={(profile, from) => {
          takeOff(profile, from);
          setStep({ kind: 'password', profile });
        }}
        onSignedIn={signedIn}
        onChangeServer={changeServer}
      />
    );
  };

  return (
    <View style={styles.whole}>
      {page()}

      {isSplashGone ? null : (
        <Splash
          isDone={hasLingered && (server === null || !session.isPending)}
          onGone={splashGone}
        />
      )}

      {flights === null || flights.mark === null ? null : (
        <Flight
          key={`mark:${flights.mark.from.x.toString()}:${flights.mark.from.y.toString()}`}
          from={flights.mark.from}
          to={flights.mark.to}
          onLanded={markLanded}
        >
          <Image
            source={mark}
            style={{ width: flights.mark.from.width, height: flights.mark.from.height }}
            contentFit="contain"
          />
        </Flight>
      )}

      {flights === null || flights.face === null ? null : (
        <Flight
          key={`face:${flights.face.from.x.toString()}:${flights.face.from.y.toString()}`}
          from={flights.face.from}
          to={flights.face.to}
          onLanded={faceLanded}
        >
          <Face profile={flights.profile} size={flights.face.from.width} />
        </Flight>
      )}
    </View>
  );
};

TheWayIn.displayName = 'TheWayIn';

const styles = StyleSheet.create({
  whole: { flex: 1 },
  waiting: {
    flex: 1,
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { TheWayIn };
