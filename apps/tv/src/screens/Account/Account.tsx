import { switchProfile } from '@ValenceClient/profiles/switchProfile';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { memo, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { describeThisBuild } from '@ValenceTv/about/describeThisBuild';
import {
  CalendarDays,
  ClipboardList,
  LogOut,
  Monitor,
  Server,
  Users,
} from '@keyline-icons/react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { useMayRequest } from '@ValenceTv/requests/useMayRequest';
import { signOutHere } from '@ValenceTv/session/signOutHere';
import { YourRequests } from '@ValenceTv/screens/Account/components/YourRequests/YourRequests';
import { ThemeChoice } from '@ValenceTv/screens/Account/components/ThemeChoice/ThemeChoice';
import { YourHistory } from '@ValenceTv/screens/Account/components/YourHistory/YourHistory';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { Face } from '@ValenceTv/components/Face/Face';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { tokens } from '@ValenceTv/theme/tokens';
import type { AccountProps } from './Account.types';
import { say } from '@ValenceI18n/say';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { canChangeServer } from '@ValenceTv/platform/canChangeServer';
import { toTheDesktopLayout } from '@ValenceTv/platform/toTheDesktopLayout';

/**
 * Who is watching on this television and which Valence it is, down the left, held still while the
 * right scrolls beneath the remote, with what they do most beneath — switching who is watching,
 * where the household has more than one, and, where they may ask for things, the release calendar
 * and everything asked for, as wide buttons with an icon to each — and the rarer ways out under
 * those: signing out, moving to another server altogether, and the desktop layout. Down the right,
 * with the width of the screen to itself, is what is going on for them: their own latest requests
 * each saying where it has got to, what they have lately watched, and any themes plugins offer,
 * with this build and the server's named at its foot, as the desktop app's account dialog does. On
 * a shared demo account it says so beneath the server. Where the account is signed in, like what it
 * has been told, is left to the phone and the web, which manage both properly.
 *
 * The page is lit by the request or the viewing the remote rests on, as Films is lit by the poster
 * it rests on, and by what they last watched until it has rested on one — never by their face,
 * which is too small a picture to blur into a wash.
 *
 * Moving to the desktop layout asks first, starting on staying put: it is made for computers, and
 * some televisions draw it as a blank page, which the server undoes by itself after ten seconds.
 *
 * @param user - Who is signed in.
 * @param onChangeServer - Told when somebody wants a different Valence.
 * @param onRequests - Told when somebody wants to see what has been asked for.
 * @param onCalendar - Told when somebody wants to see what comes out when.
 * @param onOpenRequest - Told which of their own requests somebody chose from the row of them.
 * @param onOpenNamed - Told which film or programme a chosen notification or viewing names.
 * @param upTo - The face in the bar this page belongs under, which pressing up from the top goes
 *   to.
 * @param onMood - Told the picture to light the page with, or nothing for the plain ground.
 */
const AccountPage = ({
  user,
  onChangeServer,
  onRequests,
  onCalendar,
  onOpenRequest,
  onOpenNamed,
  upTo,
  onMood,
}: AccountProps) => {
  const upToBar = useHandOff('up', upTo);
  const cache = useQueryClient();
  const watching = useQuery(profileQueries.watching());
  const profile = watching.data ?? null;
  const server = useQuery(aboutQueries.server());
  const mayRequest = useMayRequest();
  const { isDemo } = useWhatIMayDo();
  const origin = theServersOrigin();
  const toDesktop = toTheDesktopLayout();
  const household = useQuery(profileQueries.list());
  const canSwitch =
    useServerHas('profiles.chosenPerSession') === true &&
    (household.data?.profiles.length ?? 0) > 1;
  const lastWatched = useInfiniteQuery(viewingQueries.history()).data?.pages.flat()[0] ?? null;
  const [restingOn, setRestingOn] = useState<string | null>(null);
  const mood =
    restingOn ??
    (lastWatched === null
      ? null
      : artworkUrl(lastWatched.mediaItemId, 'backdrop', { isOfTitle: true, size: 'medium' }));

  useEffect(() => {
    onMood(mood);
  }, [mood, onMood]);

  return (
    <View style={styles.page}>
      <View style={styles.who}>
        <View style={styles.head}>
          {profile === null ? null : <Face profile={profile} size={120} isRound />}

          <View style={styles.said}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.name ?? user.name}
            </Text>
            <Text style={styles.server} numberOfLines={1}>
              {origin === null
                ? say('tv.account.watchingOnThisValence')
                : say('common.watchingOnAddress', {
                    address: origin.replace(/^https?:\/\//u, ''),
                  })}
            </Text>
            {isDemo ? (
              <Text style={styles.server}>{say('common.thisIsASharedDemoAccount')}</Text>
            ) : null}
          </View>
        </View>

        <FocusGuide isRemembering style={styles.catches}>
          <View style={styles.actions}>
            {canSwitch ? (
              <Button
                label={say('screens.appShell.switchProfile')}
                icon={Users}
                variant="secondary"
                isWide
                onFocus={upToBar.arrive}
                onPress={() => {
                  void switchProfile(cache);
                }}
              />
            ) : null}
            {mayRequest ? (
              <Button
                label={say('common.calendar')}
                icon={CalendarDays}
                variant="secondary"
                isWide
                onFocus={canSwitch ? upToBar.leave : upToBar.arrive}
                onPress={onCalendar}
              />
            ) : null}
            {mayRequest ? (
              <Button
                label={say('tv.account.allRequests')}
                icon={ClipboardList}
                variant="secondary"
                isWide
                onFocus={upToBar.leave}
                onPress={onRequests}
              />
            ) : null}

            <Button
              label={say('common.signOut')}
              icon={LogOut}
              variant="danger"
              isWide
              onFocus={canSwitch || mayRequest ? upToBar.leave : upToBar.arrive}
              onPress={() => {
                void signOutHere().finally(() => {
                  void cache.invalidateQueries();
                });
              }}
            />
            {canChangeServer() ? (
              <Button
                label={say('common.useADifferentServer')}
                icon={Server}
                variant="ghost"
                isWide
                onFocus={upToBar.leave}
                onPress={onChangeServer}
              />
            ) : null}
            {toDesktop === null ? null : (
              <Button
                label={say('tv.account.useTheDesktopLayout')}
                icon={Monitor}
                variant="ghost"
                isWide
                onFocus={upToBar.leave}
                onPress={() => {
                  Alert.alert(
                    say('tv.account.switchToTheDesktopLayout'),
                    say('tv.account.madeForComputersSomeTvs'),
                    [
                      { text: say('tv.account.stayOnTheTvLayout'), style: 'cancel' },
                      { text: say('tv.account.useTheDesktopLayout'), onPress: toDesktop },
                    ],
                  );
                }}
              />
            )}
          </View>
        </FocusGuide>
      </View>

      <EdgeFade edge="top" reach={0.06} style={styles.what}>
        <EdgeFade edge="bottom" reach={0.08} style={styles.what}>
          <ScrollView style={styles.what} contentContainerStyle={styles.whatInside}>
            {mayRequest ? (
              <YourRequests onOpen={onOpenRequest} onFocus={upToBar.leave} onLight={setRestingOn} />
            ) : null}

            <YourHistory onOpen={onOpenNamed} onFocus={upToBar.leave} onLight={setRestingOn} />

            <ThemeChoice onFocus={upToBar.leave} />

            <Text style={styles.build}>{describeThisBuild(server.data ?? null)}</Text>
          </ScrollView>
        </EdgeFade>
      </EdgeFade>
    </View>
  );
};

const Account = memo(AccountPage);

Account.displayName = 'Account';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    gap: tokens.space.lg,
    paddingLeft: tokens.space.edge,
  },
  who: { paddingBottom: tokens.space.lg, paddingTop: tokens.space.xl, width: tokens.ACTION_WIDTH },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  said: { flex: 1, gap: tokens.space.xs },
  what: { flex: 1 },
  whatInside: {
    gap: tokens.space.md,
    paddingBottom: tokens.space.xl,
    paddingRight: tokens.space.edge,
    paddingTop: tokens.space.lg,
  },
  name: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  server: { color: tokens.colours.muted, fontSize: tokens.type.small },
  build: {
    marginTop: tokens.space.lg,
    color: tokens.colours.muted,
    fontSize: tokens.type.small - 4,
  },
  catches: { alignSelf: 'stretch' },
  actions: { alignSelf: 'stretch', gap: tokens.space.md, marginTop: tokens.space.xl },
});

export { Account };
