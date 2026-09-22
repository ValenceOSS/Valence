import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
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
 * Coming out of the player throws away what was known about how far through everything is, because
 * the thing they just watched is the one entry that is now wrong.
 *
 * Waits for the session before drawing any of it, because every request they make depends on being
 * signed in and a library drawn first would ask a question it cannot have the answer to.
 *
 * @param onOut - Told once they have signed out.
 */
const SignedIn = ({ onOut }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());
  const cache = useQueryClient();
  const [looking, setLooking] = useState<string | null>(null);
  const [watching, setWatching] = useState<{ mediaId: string; startSeconds: number } | null>(null);

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
        mediaId={watching.mediaId}
        startSeconds={watching.startSeconds}
        onDone={() => {
          setWatching(null);
          void cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey });
        }}
      />
    );
  }

  if (looking !== null) {
    return (
      <ATitle
        mediaId={looking}
        onWatch={(mediaId, startSeconds) => {
          setWatching({ mediaId, startSeconds });
        }}
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
