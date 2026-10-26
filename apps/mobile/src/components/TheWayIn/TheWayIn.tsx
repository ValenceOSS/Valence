import { Download, RotateCw } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { ALoginMark } from '@ValenceMobile/components/ALoginMark/ALoginMark';
import { useIsTheFirstMark } from '@ValenceMobile/components/ACarriedMark/useIsTheFirstMark';
import { AWallFace } from '@ValenceMobile/components/TheWayIn/components/AWallFace/AWallFace';
import { UseAPasskey } from '@ValenceMobile/components/UseAPasskey/UseAPasskey';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheServer } from '@ValenceMobile/hooks/useTheServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheWayInProps } from './TheWayIn.types';
import { ABadge } from '@ValenceMobile/components/ABadge/ABadge';
import { useIsDemoServer } from '@ValenceClient/about/useIsDemoServer';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

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
 * Coming back to it from a face, the face that was picked flies back into its place while the rest
 * of the wall rises in around it, without the pause the app's first opening waits through.
 *
 * A passkey is offered beside the faces rather than behind one, because it already says whose it
 * is. Pointing the phone at another server sits beneath it, and at the foot what this phone's copy
 * of Valence is and what the server runs, as the desktop's way in says it.
 *
 * Where the server cannot be reached — its answer failed, or it is known to be away while the
 * answer has not come — the faces give way to saying so, with a way to try again, to watch what the
 * phone keeps, and to point it at a different server.
 *
 * @param returningFrom - The face somebody is coming back from, and where it was on the screen.
 * @param onPicked - Told whose face somebody chose, and where it was.
 * @param onReturned - Told once the face somebody came back from is drawn in its place again.
 * @param onIn - Told once somebody signed in without picking a face.
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onDownloads - Told somebody wants what this phone keeps, while the server cannot be reached.
 */
const TheWayIn = ({
  returningFrom = null,
  onPicked,
  onReturned,
  onIn,
  onElsewhere,
  onDownloads,
}: TheWayInProps) => {
  const isDemoServer = useIsDemoServer();
  const asking = useQuery(sessionQueries.wayIn());
  const message = asking.data?.message ?? null;
  const server = useQuery(aboutQueries.server());
  const build = describeTheBuild(theBuildInfo(), server.data ?? null);
  const colours = useTheColours();
  const watched = useTheServer();
  const kept = useHeldFiles().filter((file) => file.state === 'here');
  const listening = useKeptListening();
  const isAnythingKept = kept.length > 0 || listening.files.some((file) => file.state === 'here');
  const profiles = asking.data?.profiles ?? [];
  const isUnreachable = asking.isError || (watched.isAway && !asking.isSuccess);
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
              <ARising after={after}>
                <Words size="small" tone="muted">
                  {build}
                </Words>
              </ARising>
            ),
          })}
    >
      <View style={styles.wall}>
        <ALoginMark high={MARK_HIGH} isIntroducing={isFirst} settlesAfter={INTRODUCED_AFTER} />

        {isUnreachable ? (
          <ARising after={after} turn={1}>
            <View style={styles.centred}>
              <Words size="title" isCentred>
                {watched.address === null
                  ? say('common.cantReachYourServer')
                  : say('common.cantReachAddress', { address: watched.address })}
              </Words>
              <Words tone="muted" isCentred>
                {say('phone.theWayIn.itMayBeRestartingValenceTries')}
              </Words>

              <Button
                tone="bold"
                icon={RotateCw}
                onPress={() => {
                  watched.tryNow();
                  void asking.refetch();
                }}
              >
                {say('common.tryAgain')}
              </Button>

              {!isAnythingKept ? null : (
                <Button tone="ghost" icon={Download} onPress={onDownloads}>
                  {say('phone.theWayIn.watchYourDownloads')}
                </Button>
              )}
            </View>
          </ARising>
        ) : (
          <>
            <ARising after={after} turn={1}>
              <Words size="title">{say('common.whoIsWatching')}</Words>
            </ARising>

            {message === null ? null : (
              <ARising after={after} turn={1}>
                <Words
                  tone="muted"
                  isCentred
                  {...(message.colour === null ? {} : { colour: message.colour })}
                >
                  {message.text}
                </Words>
              </ARising>
            )}

            {isDemoServer ? <ABadge>{say('common.demoMode')}</ABadge> : null}

            {asking.isPending ? <ASpinner colour={colours.textMuted} /> : null}

            <View style={styles.faces}>
              {profiles.map((profile, at) => (
                <ARising
                  key={profile.id}
                  after={after}
                  turn={at + 2}
                  isArrived={returningFrom?.profileId === profile.id}
                >
                  <AWallFace
                    profile={profile}
                    arrivingFrom={
                      returningFrom !== null && returningFrom.profileId === profile.id
                        ? returningFrom.at
                        : null
                    }
                    onPicked={onPicked}
                    {...(returningFrom?.profileId === profile.id && onReturned !== undefined
                      ? { onBack: onReturned }
                      : {})}
                  />
                </ARising>
              ))}
            </View>

            {asking.isSuccess && profiles.length === 0 ? (
              <Words tone="muted">{say('common.nobodyHasAnAccountOnThis')}</Words>
            ) : null}
          </>
        )}
      </View>

      <ARising after={after} turn={profiles.length + 2}>
        <View style={styles.foot}>
          <UseAPasskey label={say('phone.theWayIn.signInWithAPasskey')} onIn={onIn} />

          <Button tone="ghost" onPress={onElsewhere}>
            {say('common.useADifferentServer')}
          </Button>
        </View>
      </ARising>
    </Screen>
  );
};

TheWayIn.displayName = 'TheWayIn';

export { TheWayIn };
