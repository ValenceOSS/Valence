import { sayAgain } from '@ValenceI18n/sayAgain';
import { Inbox } from '@keyline-icons/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import {
  clearNotifications,
  markNotificationsRead,
} from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whereANotificationLeads } from '@ValenceMobile/components/TheNotifications/whereANotificationLeads';
import { readPartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import type { TheNotificationsProps } from './TheNotifications.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const DOT = 8;

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: { borderRadius: DOT / 2, height: DOT, marginTop: 7, width: DOT },
  lines: { gap: 16, paddingBottom: 24 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  scrolls: { flex: 1 },
  words: { flex: 1, gap: 3 },
});

/**
 * What the server has told this account, newest first, as the web's bell lists it, in a sheet that
 * rises over the page: each opens what it is about, where that is something a phone shows, and is
 * read once opened. Everything can be marked read at once, or, asked first, cleared.
 *
 * @param isOpen - Whether the sheet is out.
 * @param onOpen - Told to open the page a notification is about.
 * @param onJoin - Told to join the watch or listening party a notification asks them into.
 * @param onClose - Told somebody is done with them.
 */
const TheNotifications = ({ isOpen, onOpen, onJoin, onClose }: TheNotificationsProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const inbox = useQuery(notificationQueries.inbox());
  const notifications = inbox.data?.notifications ?? [];
  const now = new Date();

  const reread = () => cache.invalidateQueries({ queryKey: notificationQueries.key });

  const clearThemAll = () => {
    Alert.alert(
      say('phone.theNotifications.clearEveryNotification'),
      say('phone.theNotifications.theyAreGoneForGood'),
      [
        { text: say('common.keepThem'), style: 'cancel' },
        {
          text: say('common.clearAll'),
          style: 'destructive',
          onPress: () => {
            void clearNotifications().then(reread);
          },
        },
      ],
    );
  };

  return (
    <ABottomSheet
      isOpen={isOpen}
      isTall
      label={say('common.notifications')}
      title={say('common.notifications')}
      onClose={onClose}
    >
      <ScrollView style={styles.scrolls} contentContainerStyle={styles.lines}>
        {notifications.length === 0 ? null : (
          <View style={styles.actions}>
            <Button
              tone="quiet"
              onPress={() => {
                void markNotificationsRead().then(reread);
              }}
            >
              {say('common.markAllRead')}
            </Button>
            <Button tone="quiet" onPress={clearThemAll}>
              {say('common.clearAll')}
            </Button>
          </View>
        )}

        {inbox.isPending ? <ASpinner colour={colours.textMuted} /> : null}

        {inbox.isError ? <Words tone="danger">{say('common.thoseCouldNotBeRead')}</Words> : null}

        {!inbox.isPending && notifications.length === 0 ? (
          <ANothingHere of={Inbox} title={say('phone.theNotifications.nothingNew')} />
        ) : null}

        {notifications.map((notification) => {
          const leads = whereANotificationLeads(notification.link);
          const invitation = readPartyInvitation(notification.link);
          const isUnread = notification.readAt === null;

          return (
            <Button
              key={notification.id}
              tone="bare"
              label={sayAgain(notification.title)}
              onPress={() => {
                void clearNotifications(notification.id).then(reread);

                if (invitation !== null || leads !== null) {
                  onClose();
                }

                if (invitation !== null) {
                  onJoin(invitation);

                  return;
                }

                if (leads !== null) {
                  onOpen(leads);
                }
              }}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isUnread ? colours.accent : 'transparent' },
                  ]}
                />
                <View style={styles.words}>
                  <Words>{sayAgain(notification.title)}</Words>
                  <Words size="small" tone="muted">
                    {sayAgain(notification.body)}
                  </Words>
                  <Words size="small" tone="muted">
                    {describeWhen(new Date(notification.createdAt), now)}
                  </Words>
                </View>
              </View>
            </Button>
          );
        })}
      </ScrollView>
    </ABottomSheet>
  );
};

TheNotifications.displayName = 'TheNotifications';

export { TheNotifications };
