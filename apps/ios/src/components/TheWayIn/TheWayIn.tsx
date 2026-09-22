import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { UseAPasskey } from '@ValencePhone/components/UseAPasskey/UseAPasskey';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheServer } from '@ValencePhone/hooks/useTheServer';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheWayInProps } from './TheWayIn.types';

const styles = StyleSheet.create({
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
});

/**
 * The way in: who lives here, drawn from the server this phone was told to watch.
 *
 * A passkey is offered beside the faces rather than behind one, because it already says whose it is.
 *
 * @param onPicked - Told whose face somebody chose.
 * @param onIn - Told once somebody signed in without picking a face.
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onDownloads - Told somebody wants what this phone keeps, while the server cannot be reached.
 */
const TheWayIn = ({ onPicked, onIn, onElsewhere, onDownloads }: TheWayInProps) => {
  const asking = useQuery(sessionQueries.wayIn());
  const colours = useTheColours();
  const server = useTheServer();
  const kept = useHeldFiles().filter((file) => file.state === 'here');

  return (
    <Screen scrolls>
      <Words size="title">Who is watching?</Words>

      {asking.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

      {asking.isError ? (
        <>
          <Words>{`Can’t reach ${server.address ?? 'your server'}.`}</Words>
          <Words tone="muted">
            It may be restarting. Valence tries again every few seconds, or pull down to try now.
          </Words>
          <Button
            onPress={() => {
              server.tryNow();
              void asking.refetch();
            }}
          >
            Try again
          </Button>

          {kept.length === 0 ? null : (
            <Button tone="quiet" onPress={onDownloads}>
              Watch your downloads
            </Button>
          )}
        </>
      ) : (
        <View style={styles.faces}>
          {(asking.data?.profiles ?? []).map((profile) => (
            <Button
              key={profile.id}
              tone="bare"
              label={`Sign in as ${profile.name}`}
              onPress={() => {
                onPicked(profile);
              }}
            >
              <AFace profile={profile} />
            </Button>
          ))}
        </View>
      )}

      <UseAPasskey label="Sign in with a passkey" onIn={onIn} />

      <Button tone="quiet" onPress={onElsewhere}>
        Use a different server
      </Button>
    </Screen>
  );
};

TheWayIn.displayName = 'TheWayIn';

export { TheWayIn };
