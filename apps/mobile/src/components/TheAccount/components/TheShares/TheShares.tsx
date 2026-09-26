import { useState } from 'react';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { revokeShare } from '@ValenceClient/sharing/fetchShares';
import { saidOpened } from '@ValenceClient/sharing/saidOpened';
import { shareStanding } from '@ValenceClient/sharing/shareStanding';
import { untilWhen } from '@ValenceClient/sharing/untilWhen';
import { shareQueries } from '@ValenceClient/query/shareQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { Share } from '@ValenceContracts/schemas/Share';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  words: { flex: 1, gap: 2 },
});

/**
 * The links this account has handed out, as the web's share panel lists them: what each shares,
 * whether it still works, how many times it has been opened and until when it lasts, and a way to
 * withdraw one that still works — asked about first, since a link withdrawn cannot be brought back.
 */
const TheShares = () => {
  const colours = useTheColours();
  const cache = useQueryClient();
  const read = useQuery(shareQueries.mine());
  const [now] = useState(() => Date.now());
  const shares = [...(read.data ?? [])].sort(
    (one, other) => Date.parse(other.createdAt) - Date.parse(one.createdAt),
  );

  /**
   * Asks whether to withdraw a link, and withdraws it if so.
   *
   * @param share - The link.
   */
  const withdraw = (share: Share) => {
    Alert.alert(
      `Withdraw the link to ${share.title}?`,
      'Anybody who has it will no longer be able to open it. This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => {
            void revokeShare(share.id).then(async (isWithdrawn) => {
              if (!isWithdrawn) {
                Alert.alert('That link could not be withdrawn.');

                return;
              }

              await cache.invalidateQueries({ queryKey: shareQueries.key });
            });
          },
        },
      ],
    );
  };

  return (
    <>
      <Words tone="muted">
        Links you have handed out. Share something from its own page, and it will be here.
      </Words>

      {read.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

      {read.isError ? <Words tone="danger">Your links could not be read.</Words> : null}

      {!read.isPending && shares.length === 0 ? (
        <Words tone="muted">You have not shared anything yet.</Words>
      ) : null}

      {shares.length === 0 ? null : (
        <AGroup title="Shared links">
          {shares.map((share) => {
            const standing = shareStanding(share, now);

            return (
              <View key={share.id} style={styles.row}>
                <View style={styles.words}>
                  <Words lines={1}>{share.title}</Words>
                  <Words size="small" tone="muted">
                    {[standing.label, `Opened ${saidOpened(share)}`, untilWhen(share)].join(' · ')}
                  </Words>
                </View>
                {standing.isLive ? (
                  <Button
                    tone="quiet"
                    label={`Withdraw the link to ${share.title}`}
                    onPress={() => {
                      withdraw(share);
                    }}
                  >
                    Withdraw
                  </Button>
                ) : null}
              </View>
            );
          })}
        </AGroup>
      )}
    </>
  );
};

TheShares.displayName = 'TheShares';

export { TheShares };
