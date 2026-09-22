import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';

const answers = buildQueryClient();

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0e0e' },
  name: { color: '#f6fbf9', fontSize: 24, fontWeight: '600' },
  proof: { color: '#9aa0a6', fontSize: 13, marginTop: 8 },
});

/**
 * What a phone draws before there is anything to draw.
 *
 * Stands in for the application while the client is being brought up, and proves the wiring it will
 * need: the query cache the readers run on, and a contract read straight out of the shared schemas.
 */
const Phone = () => (
  <QueryClientProvider client={answers}>
    <View style={styles.screen}>
      <Text style={styles.name}>Valence</Text>
      <Text style={styles.proof}>shared contracts say {profileInitial('valence')}</Text>
      <StatusBar style="auto" />
    </View>
  </QueryClientProvider>
);

Phone.displayName = 'Phone';

export { Phone };
