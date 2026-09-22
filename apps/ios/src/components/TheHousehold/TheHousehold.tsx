import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AskForThePassword } from '@ValencePhone/components/AskForThePassword/AskForThePassword';
import { SignedIn } from '@ValencePhone/components/SignedIn/SignedIn';
import { TheWayIn } from '@ValencePhone/components/TheWayIn/TheWayIn';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import type { TheHouseholdProps } from './TheHousehold.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * What this phone shows once it knows where its Valence is: the way in, or what is behind it.
 *
 * Which of the two is decided by asking the server rather than by remembering, so a session that
 * ended somewhere else — signed out on another device, expired, revoked by an administrator —
 * puts the wall of faces back rather than showing a screen that cannot load anything.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 */
const TheHousehold = ({ onElsewhere }: TheHouseholdProps) => {
  const answers = useQueryClient();
  const session = useQuery(sessionQueries.who());
  const [picked, setPicked] = useState<ViewerProfile | null>(null);

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (session.data !== null && session.data !== undefined) {
    return (
      <SignedIn
        onOut={() => {
          void answers.invalidateQueries();
        }}
      />
    );
  }

  return picked === null ? (
    <TheWayIn
      onPicked={setPicked}
      onIn={() => {
        void answers.invalidateQueries();
      }}
      onElsewhere={onElsewhere}
    />
  ) : (
    <AskForThePassword
      profile={picked}
      onIn={() => {
        setPicked(null);
        void answers.invalidateQueries();
      }}
      onBack={() => {
        setPicked(null);
      }}
    />
  );
};

TheHousehold.displayName = 'TheHousehold';

export { TheHousehold };
