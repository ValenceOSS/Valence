import { Bell } from '@keyline-icons/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import {
  clearNotifications,
  markNotificationsRead,
} from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whereANotificationLeads } from '@ValenceMobile/components/TheNotifications/whereANotificationLeads';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import type { TheNotificationsProps } from './TheNotifications.types';

const DOT = 8;

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: { borderRadius: DOT / 2, height: DOT, marginTop: 7, width: DOT },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  words: { flex: 1, gap: 3 },
});

/**
 * What the server has told this account, newest first, as the web's bell lists it: each opens
 * what it is about, where that is something a phone shows, and is read once opened. Everything can
 * be marked read at once, or, asked first, cleared.
 *
 * @param onOpen - Told to open the page a notification is about.
 * @param onBack - Told somebody is done with them.
 */
const TheNotifications = ({ onOpen, onBack }: TheNotificationsProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const inbox = useQuery(notificationQueries.inbox());
  const notifications = inbox.data?.notifications ?? [];
  const now = new Date();

  const reread = () => cache.invalidateQueries({ queryKey: notificationQueries.key });

  const clearThemAll = () => {
    Alert.alert('Clear every notification?', 'They are gone for good.', [
      { text: 'Keep them', style: 'cancel' },
      {
        text: 'Clear them',
        style: 'destructive',
        onPress: () => {
          void clearNotifications().then(reread);
        },
      },
    ]);
  };

  return (
    <Screen scrolls onBack={onBack}>
      <Words size="title">Notifications</Words>

      {notifications.length === 0 ? null : (
        <View style={styles.actions}>
          <Button
            tone="quiet"
            onPress={() => {
              void markNotificationsRead().then(reread);
            }}
          >
            Mark all read
          </Button>
          <Button tone="quiet" onPress={clearThemAll}>
            Clear all
          </Button>
        </View>
      )}

      {inbox.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

      {inbox.isError ? <Words tone="danger">Those could not be read.</Words> : null}

      {!inbox.isPending && notifications.length === 0 ? (
        <ANothingHere of={Bell} title="Nothing new" />
      ) : null}

      {notifications.map((notification) => {
        const leads = whereANotificationLeads(notification.link);
        const isUnread = notification.readAt === null;

        return (
          <Button
            key={notification.id}
            tone="bare"
            label={notification.title}
            onPress={() => {
              if (isUnread) {
                void markNotificationsRead(notification.id).then(reread);
              }

              if (leads !== null) {
                onOpen(leads);
              }
            }}
          >
            <View style={styles.row}>
              <View
                style={[styles.dot, { backgroundColor: isUnread ? colours.accent : 'transparent' }]}
              />
              <View style={styles.words}>
                <Words>{notification.title}</Words>
                <Words size="small" tone="muted">
                  {notification.body}
                </Words>
                <Words size="small" tone="muted">
                  {describeWhen(new Date(notification.createdAt), now)}
                </Words>
              </View>
            </View>
          </Button>
        );
      })}
    </Screen>
  );
};

TheNotifications.displayName = 'TheNotifications';

export { TheNotifications };
