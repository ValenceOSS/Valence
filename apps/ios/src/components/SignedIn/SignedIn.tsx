import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { signOut } from '@ValenceClient/session/auth';
import { ATitle } from '@ValencePhone/components/ATitle/ATitle';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TheLibrary } from '@ValencePhone/components/TheLibrary/TheLibrary';
import { Watching } from '@ValencePhone/components/Watching/Watching';
import type { SignedInProps } from './SignedIn.types';

/**
 * What a phone shows once somebody is through: the library, a title out of it, or that title
 * playing.
 *
 * Where they are is held here rather than in an address, because a phone has no address bar and
 * three screens do not need a router to tell them apart. It will when there are more.
 *
 * Waits for the session before drawing any of it, because every request they make depends on being
 * signed in and a library drawn first would ask a question it cannot have the answer to.
 *
 * @param onOut - Told once they have signed out.
 */
const SignedIn = ({ onOut }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());
  const [looking, setLooking] = useState<string | null>(null);
  const [watching, setWatching] = useState<string | null>(null);

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (watching !== null) {
    return (
      <Watching
        mediaId={watching}
        onDone={() => {
          setWatching(null);
        }}
      />
    );
  }

  if (looking !== null) {
    return (
      <ATitle
        mediaId={looking}
        onWatch={setWatching}
        onBack={() => {
          setLooking(null);
        }}
      />
    );
  }

  return (
    <TheLibrary
      onLookAt={setLooking}
      onOut={() => {
        void signOut().then(onOut);
      }}
    />
  );
};

SignedIn.displayName = 'SignedIn';

export { SignedIn };
