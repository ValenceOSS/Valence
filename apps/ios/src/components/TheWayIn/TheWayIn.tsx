import { Download, RotateCw } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { ARising } from '@ValencePhone/components/ARising/ARising';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { ALoginMark } from '@ValencePhone/components/ALoginMark/ALoginMark';
import { useIsTheFirstMark } from '@ValencePhone/components/ACarriedMark/useIsTheFirstMark';
import { AWallFace } from '@ValencePhone/components/TheWayIn/components/AWallFace/AWallFace';
import { UseAPasskey } from '@ValencePhone/components/UseAPasskey/UseAPasskey';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheServer } from '@ValencePhone/hooks/useTheServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheWayInProps } from './TheWayIn.types';

const MARK_HIGH = 40;

const INTRODUCED_AFTER = 1100;

const styles = StyleSheet.create({
  centred: { alignItems: 'center', gap: 12 },
  faces: {
    columnGap: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 28,
  },
  foot: { alignItems: 'center', gap: 10, marginTop: 16 },
  wall: { alignItems: 'center', gap: 36 },
});

/**
 * The way in: who lives here, drawn from the server this phone was told to watch, as the web's
 * wall of faces draws it — the mark gliding in from the screen before, or arriving large in the
 * middle when the app has only just opened, and the question and the faces rising in beneath it
 * one after another.
 *
 * Coming back to it from a face is not arriving: the wall is simply there, and the face that was
 * picked flies back into its place.
 *
 * A passkey is offered beside the faces rather than behind one, because it already says whose it
 * is. Pointing the phone at another server sits beneath it, and at the foot what this phone's copy
 * of Valence is and what the server runs, as the desktop's way in says it.
 *
 * @param returningFrom - The face somebody is coming back from, and where it was on the screen.
 * @param onPicked - Told whose face somebody chose, and where it was.
 * @param onIn - Told once somebody signed in without picking a face.
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onDownloads - Told somebody wants what this phone keeps, while the server cannot be reached.
 */
const TheWayIn = ({
  returningFrom = null,
  onPicked,
  onIn,
  onElsewhere,
  onDownloads,
}: TheWayInProps) => {
  const asking = useQuery(sessionQueries.wayIn());
  const server = useQuery(aboutQueries.server());
  const build = describeTheBuild(theBuildInfo(), server.data?.commit ?? null);
  const colours = useTheColours();
  const watched = useTheServer();
  const kept = useHeldFiles().filter((file) => file.state === 'here');
  const profiles = asking.data?.profiles ?? [];
  const [isReturning] = useState(returningFrom !== null);
  const isFirst = useIsTheFirstMark();
  const after = isFirst ? INTRODUCED_AFTER : 0;

  return (
    <Screen
      scrolls
      centres
      isSeeThrough
      {...(build === null
        ? {}
        : {
            foot: (
              <ARising after={after} isArrived={isReturning}>
                <Words size="small" tone="muted">
                  {build}
                </Words>
              </ARising>
            ),
          })}
    >
      <View style={styles.wall}>
        <ALoginMark high={MARK_HIGH} isIntroducing={isFirst} settlesAfter={INTRODUCED_AFTER} />

        {asking.isError ? (
          <ARising after={after} turn={1}>
            <View style={styles.centred}>
              <Words size="title" isCentred>
                {`Can’t reach ${watched.address ?? 'your server'}`}
              </Words>
              <Words tone="muted" isCentred>
                It may be restarting. Valence tries again every few seconds, or pull down to try
                now.
              </Words>

              <Button
                tone="bold"
                icon={RotateCw}
                onPress={() => {
                  watched.tryNow();
                  void asking.refetch();
                }}
              >
                Try again
              </Button>

              {kept.length === 0 ? null : (
                <Button tone="ghost" icon={Download} onPress={onDownloads}>
                  Watch your downloads
                </Button>
              )}
            </View>
          </ARising>
        ) : (
          <>
            <ARising after={after} turn={1} isArrived={isReturning}>
              <Words size="title">Who is watching?</Words>
            </ARising>

            {asking.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

            <View style={styles.faces}>
              {profiles.map((profile, at) => (
                <ARising key={profile.id} after={after} turn={at + 2} isArrived={isReturning}>
                  <AWallFace
                    profile={profile}
                    arrivingFrom={
                      returningFrom !== null && returningFrom.profileId === profile.id
                        ? returningFrom.at
                        : null
                    }
                    onPicked={onPicked}
                  />
                </ARising>
              ))}
            </View>

            {asking.isSuccess && profiles.length === 0 ? (
              <Words tone="muted">Nobody has an account on this server yet.</Words>
            ) : null}
          </>
        )}
      </View>

      <ARising after={after} turn={profiles.length + 2} isArrived={isReturning}>
        <View style={styles.foot}>
          <UseAPasskey label="Sign in with a passkey" onIn={onIn} />

          <Button tone="ghost" onPress={onElsewhere}>
            Use a different server
          </Button>
        </View>
      </ARising>
    </Screen>
  );
};

TheWayIn.displayName = 'TheWayIn';

export { TheWayIn };
