import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { signOut } from '@ValenceClient/session/auth';
import type { SignedInProps } from './SignedIn.types';

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 12, padding: 24 },
  greeting: { color: '#f6fbf9', fontSize: 28, fontWeight: '600' },
  detail: { color: '#9aa0a6', fontSize: 14 },
  out: { color: '#3a8ee8', fontSize: 16, paddingTop: 16 },
});

/**
 * What a phone shows once somebody is through, which for now is who they are.
 *
 * A holding screen, and deliberately a truthful one: the library is the next thing to build and
 * pretending otherwise would be a screen that promises what is not there.
 *
 * @param onOut - Told once they have signed out.
 */
const SignedIn = ({ onOut }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());

  if (session.isPending) {
    return <ActivityIndicator color="#f6fbf9" />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.greeting}>Hello, {session.data?.name ?? 'you'}</Text>
      <Text style={styles.detail}>{session.data?.email ?? ''}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void signOut().then(onOut);
        }}
      >
        <Text style={styles.out}>Sign out</Text>
      </Pressable>
    </View>
  );
};

SignedIn.displayName = 'SignedIn';

export { SignedIn };
