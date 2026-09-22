import { StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { signOut } from '@ValenceClient/session/auth';
import { Button } from '@ValenceTv/components/Button/Button';
import { Face } from '@ValenceTv/components/Face/Face';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { tokens } from '@ValenceTv/theme/tokens';
import type { AccountProps } from './Account.types';

/**
 * Who is watching on this television and which Valence it is, with the two ways out: signing out,
 * so somebody else can pick their face, and moving to another server altogether.
 *
 * @param user - Who is signed in.
 * @param onChangeServer - Told when somebody wants a different Valence.
 */
const Account = ({ user, onChangeServer }: AccountProps) => {
  const cache = useQueryClient();
  const watching = useQuery(profileQueries.watching());
  const profile = watching.data ?? null;

  return (
    <View style={styles.screen}>
      {profile === null ? null : <Face profile={profile} size={200} />}

      <Text style={styles.name}>{profile?.name ?? user.name}</Text>
      <Text style={styles.server}>Watching on {theServersOrigin() ?? 'this Valence'}</Text>

      <View style={styles.actions}>
        <Button
          label="Switch profile"
          variant="secondary"
          isWide
          onPress={() => {
            void signOut().finally(() => {
              keepTheSessionToken(null);
              void cache.invalidateQueries();
            });
          }}
        />
        <Button label="Use a different server" variant="ghost" onPress={onChangeServer} />
      </View>
    </View>
  );
};

Account.displayName = 'Account';

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.space.sm },
  name: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  server: { color: tokens.colours.muted, fontSize: tokens.type.small },
  actions: { width: 760, gap: tokens.space.md, alignItems: 'center', marginTop: tokens.space.lg },
});

export { Account };
