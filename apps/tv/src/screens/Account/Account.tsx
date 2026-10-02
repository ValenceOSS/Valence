import { memo } from 'react';
import { ScrollView, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { describeThisBuild } from '@ValenceTv/about/describeThisBuild';
import { Button } from '@ValenceTv/components/Button/Button';
import { useMayRequest } from '@ValenceTv/requests/useMayRequest';
import { signOutHere } from '@ValenceTv/session/signOutHere';
import { YourRequests } from '@ValenceTv/screens/Account/components/YourRequests/YourRequests';
import { ThemeChoice } from '@ValenceTv/screens/Account/components/ThemeChoice/ThemeChoice';
import { PluginPages } from '@ValenceTv/screens/Account/components/PluginPages/PluginPages';
import { YourDevices } from '@ValenceTv/screens/Account/components/YourDevices/YourDevices';
import { YourNotifications } from '@ValenceTv/screens/Account/components/YourNotifications/YourNotifications';
import { Face } from '@ValenceTv/components/Face/Face';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { tokens } from '@ValenceTv/theme/tokens';
import type { AccountProps } from './Account.types';
import { say } from '@ValenceI18n/say';

/**
 * Who is watching on this television and which Valence it is, with the two ways out: signing out,
 * so somebody else can pick their face, and moving to another server altogether — and, where they
 * may ask for things, the way to see what has been asked for, with a row of their own latest
 * requests beneath, each saying where it has got to, after what the account has lately been told.
 * The buttons catch the remote across the whole width of the page, so pressing up from anywhere
 * along that row reaches them.
 * Beneath them are the pages plugins on this server add to an account, each opening on its own,
 * everywhere the account is signed in, and any themes those plugins offer. Its foot names this
 * build and the server's, as the desktop app's account dialog does.
 *
 * @param user - Who is signed in.
 * @param onChangeServer - Told when somebody wants a different Valence.
 * @param onRequests - Told when somebody wants to see what has been asked for.
 * @param onOpenRequest - Told which of their own requests somebody chose from the row of them.
 * @param onOpenPluginPage - Told which plugin page somebody chose.
 * @param onOpenNamed - Told which film or programme a chosen notification names.
 * @param upTo - The face in the bar this page belongs under, which pressing up from the top goes to.
 */
const AccountPage = ({
  user,
  onChangeServer,
  onRequests,
  onOpenRequest,
  onOpenPluginPage,
  onOpenNamed,
  upTo,
}: AccountProps) => {
  const upToBar = useHandOff('up', upTo);
  const cache = useQueryClient();
  const watching = useQuery(profileQueries.watching());
  const profile = watching.data ?? null;
  const server = useQuery(aboutQueries.server());
  const mayRequest = useMayRequest();
  const origin = theServersOrigin();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.screen}>
      {profile === null ? null : <Face profile={profile} size={160} />}

      <Text style={styles.name}>{profile?.name ?? user.name}</Text>
      <Text style={styles.server}>
        {origin === null
          ? say('tv.account.watchingOnThisValence')
          : say('common.watchingOnAddress', { address: origin })}
      </Text>

      <TVFocusGuideView autoFocus style={styles.catches}>
        <View style={styles.actions}>
          <Button
            label={say('common.signOut')}
            detail={say('tv.account.chooseAnotherProfile')}
            variant="secondary"
            isWide
            onFocus={upToBar.arrive}
            onPress={() => {
              void signOutHere().finally(() => {
                void cache.invalidateQueries();
              });
            }}
          />
          {mayRequest ? (
            <Button
              label={say('tv.account.allRequests')}
              variant="secondary"
              isWide
              onFocus={upToBar.leave}
              onPress={onRequests}
            />
          ) : null}
          <Button
            label={say('common.useADifferentServer')}
            variant="ghost"
            onFocus={upToBar.leave}
            onPress={onChangeServer}
          />
        </View>
      </TVFocusGuideView>

      <YourNotifications onOpen={onOpenNamed} onFocus={upToBar.leave} />

      {mayRequest ? <YourRequests onOpen={onOpenRequest} onFocus={upToBar.leave} /> : null}

      <PluginPages onOpen={onOpenPluginPage} onFocus={upToBar.leave} />

      <YourDevices onFocus={upToBar.leave} />

      <ThemeChoice onFocus={upToBar.leave} />

      <Text style={styles.build}>{describeThisBuild(server.data ?? null)}</Text>
    </ScrollView>
  );
};

const Account = memo(AccountPage);

Account.displayName = 'Account';

const styles = StyleSheet.create({
  page: { flex: 1 },
  screen: {
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingTop: tokens.space.lg,
    paddingBottom: tokens.space.lg,
  },
  name: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  server: { color: tokens.colours.muted, fontSize: tokens.type.small },
  build: {
    marginTop: tokens.space.lg,
    color: tokens.colours.muted,
    fontSize: tokens.type.small - 4,
  },
  catches: { alignSelf: 'stretch', alignItems: 'center' },
  actions: { width: 760, gap: tokens.space.md, alignItems: 'center', marginTop: tokens.space.lg },
});

export { Account };
