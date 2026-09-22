import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import type { TheWayInProps } from './TheWayIn.types';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0e0e0e' },
  inside: { padding: 24, gap: 24, paddingTop: 96 },
  title: { color: '#f6fbf9', fontSize: 28, fontWeight: '600' },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  trouble: { color: '#e8503a', fontSize: 14 },
  again: { color: '#3a8ee8', fontSize: 14 },
});

/**
 * The way in: who lives here, drawn from the server this phone was told to watch.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 */
const TheWayIn = ({ onElsewhere }: TheWayInProps) => {
  const asking = useQuery(sessionQueries.wayIn());

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.inside}>
      <Text style={styles.title}>Who is watching?</Text>

      {asking.isPending ? <ActivityIndicator color="#f6fbf9" /> : null}

      {asking.isError ? (
        <Text style={styles.trouble}>That server did not answer.</Text>
      ) : (
        <View style={styles.faces}>
          {(asking.data?.profiles ?? []).map((profile) => (
            <AFace key={profile.id} profile={profile} />
          ))}
        </View>
      )}

      <Pressable accessibilityRole="button" onPress={onElsewhere}>
        <Text style={styles.again}>Use a different server</Text>
      </Pressable>
    </ScrollView>
  );
};

TheWayIn.displayName = 'TheWayIn';

export { TheWayIn };
