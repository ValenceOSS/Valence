import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AskForThePassword } from '@ValencePhone/components/AskForThePassword/AskForThePassword';
import { SignedIn } from '@ValencePhone/components/SignedIn/SignedIn';
import { TheWayIn } from '@ValencePhone/components/TheWayIn/TheWayIn';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TheServerIsAway } from '@ValencePhone/components/TheServerIsAway/TheServerIsAway';
import { useTheServer } from '@ValencePhone/hooks/useTheServer';
import type { TheHouseholdProps } from './TheHousehold.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

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
 * It keeps an eye on whether the server is answering at all, so that one which went quiet — while
 * somebody was signed in or before they could — picks everything up again once it is back.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 */
const TheHousehold = ({ onElsewhere }: TheHouseholdProps) => {
  const answers = useQueryClient();
  const session = useQuery(sessionQueries.who());
  const [picked, setPicked] = useState<ViewerProfile | null>(null);

  useTheServer();

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (session.data !== null && session.data !== undefined) {
    return (
      <View style={styles.whole}>
        <SignedIn
          onOut={() => {
            void answers.invalidateQueries();
          }}
        />
        <TheServerIsAway />
      </View>
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
