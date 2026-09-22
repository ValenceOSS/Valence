import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { Face } from '@ValenceTv/components/Face/Face';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { WhoIsWatchingProps } from './WhoIsWatching.types';

const FACE_SIZE = 200;

/**
 * Who is watching: the household's faces in a row, for the remote to move along and pick one.
 *
 * Picking a face asks for its PIN. A household that would rather not type anything with a remote
 * signs in with a phone instead, which is offered beneath the faces rather than instead of them.
 *
 * @param onChoose - Told which face was picked.
 * @param onUsePhone - Told when somebody would rather sign in with their phone.
 * @param onChangeServer - Told when somebody wants a different Valence.
 */
const WhoIsWatching = ({ onChoose, onUsePhone, onChangeServer }: WhoIsWatchingProps) => {
  const wayIn = useQuery(sessionQueries.wayIn());
  const profiles = wayIn.data?.profiles ?? [];

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Who is watching?</Text>

      {wayIn.isPending ? (
        <ActivityIndicator size="large" color={tokens.colours.text} />
      ) : wayIn.isError ? (
        <Text style={styles.problem}>This Valence could not be reached.</Text>
      ) : (
        <FlatList
          horizontal
          data={profiles}
          keyExtractor={(profile) => profile.id}
          style={styles.faces}
          contentContainerStyle={styles.facesInside}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Focusable
              label={item.name}
              hasPreferredFocus={index === 0}
              onPress={() => {
                onChoose(item);
              }}
            >
              {(isFocused) => (
                <View style={styles.person}>
                  <Face profile={item} size={FACE_SIZE} isFocused={isFocused} />
                  <Text style={[styles.name, isFocused && styles.nameFocused]}>{item.name}</Text>
                </View>
              )}
            </Focusable>
          )}
        />
      )}

      <View style={styles.actions}>
        <Button label="Sign in with your phone" variant="secondary" onPress={onUsePhone} />
        <Button label="Use a different server" variant="secondary" onPress={onChangeServer} />
      </View>
    </View>
  );
};

WhoIsWatching.displayName = 'WhoIsWatching';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colours.canvas,
    paddingVertical: tokens.space.xl,
    justifyContent: 'center',
    gap: tokens.space.xl,
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '700',
    textAlign: 'center',
  },
  problem: { color: tokens.colours.muted, fontSize: tokens.type.body, textAlign: 'center' },
  faces: { flexGrow: 0 },
  facesInside: { paddingHorizontal: tokens.space.edge, gap: tokens.space.lg, paddingVertical: 30 },
  person: { alignItems: 'center', gap: tokens.space.sm, width: FACE_SIZE + 20 },
  name: { color: tokens.colours.muted, fontSize: tokens.type.body },
  nameFocused: { color: tokens.colours.text, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: tokens.space.md },
});

export { WhoIsWatching };
