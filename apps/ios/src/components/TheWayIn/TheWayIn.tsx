import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheWayInProps } from './TheWayIn.types';

const styles = StyleSheet.create({
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  pressed: { opacity: 0.7 },
});

/**
 * The way in: who lives here, drawn from the server this phone was told to watch.
 *
 * @param onPicked - Told whose face somebody chose.
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 */
const TheWayIn = ({ onPicked, onElsewhere }: TheWayInProps) => {
  const asking = useQuery(sessionQueries.wayIn());
  const colours = useTheColours();

  return (
    <Screen scrolls>
      <Words size="title">Who is watching?</Words>

      {asking.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

      {asking.isError ? (
        <Words tone="danger">That server did not answer.</Words>
      ) : (
        <View style={styles.faces}>
          {(asking.data?.profiles ?? []).map((profile) => (
            <Pressable
              key={profile.id}
              accessibilityRole="button"
              accessibilityLabel={`Sign in as ${profile.name}`}
              style={({ pressed }) => [pressed && styles.pressed]}
              onPress={() => {
                onPicked(profile);
              }}
            >
              <AFace profile={profile} />
            </Pressable>
          ))}
        </View>
      )}

      <Button tone="quiet" onPress={onElsewhere}>
        Use a different server
      </Button>
    </Screen>
  );
};

TheWayIn.displayName = 'TheWayIn';

export { TheWayIn };
