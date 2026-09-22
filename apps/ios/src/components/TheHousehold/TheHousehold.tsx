import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AskForThePassword } from '@ValencePhone/components/AskForThePassword/AskForThePassword';
import { SignedIn } from '@ValencePhone/components/SignedIn/SignedIn';
import { TheWayIn } from '@ValencePhone/components/TheWayIn/TheWayIn';
import type { TheHouseholdProps } from './TheHousehold.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0e0e' },
  inside: { flex: 1, backgroundColor: '#0e0e0e' },
});

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
      <View style={styles.screen}>
        <ActivityIndicator color="#f6fbf9" />
      </View>
    );
  }

  if (session.data !== null && session.data !== undefined) {
    return (
      <View style={styles.inside}>
        <SignedIn
          onOut={() => {
            void answers.invalidateQueries();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.inside}>
      {picked === null ? (
        <TheWayIn onPicked={setPicked} onElsewhere={onElsewhere} />
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
      )}
    </View>
  );
};

TheHousehold.displayName = 'TheHousehold';

export { TheHousehold };
