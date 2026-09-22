import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { signOut } from '@ValenceClient/session/auth';
import { TheLibrary } from '@ValencePhone/components/TheLibrary/TheLibrary';
import type { SignedInProps } from './SignedIn.types';

/**
 * What a phone shows once somebody is through.
 *
 * Waits for the session before drawing the library rather than drawing both at once, because every
 * request the library makes depends on being signed in and a library drawn first would ask a
 * question it cannot have the answer to.
 *
 * @param onOut - Told once they have signed out.
 */
const SignedIn = ({ onOut }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());

  if (session.isPending) {
    return <ActivityIndicator color="#f6fbf9" />;
  }

  return (
    <TheLibrary
      onOut={() => {
        void signOut().then(onOut);
      }}
    />
  );
};

SignedIn.displayName = 'SignedIn';

export { SignedIn };
