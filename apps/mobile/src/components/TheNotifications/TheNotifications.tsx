import { Inbox } from '@keyline-icons/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ANotification } from '@ValenceMobile/components/TheNotifications/components/ANotification/ANotification';
import {
  clearNotifications,
  markNotificationsRead,
} from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whereANotificationLeads } from '@ValenceMobile/components/TheNotifications/whereANotificationLeads';
import { readPartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import type { TheNotificationsProps } from './TheNotifications.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
});

/**
 * What the server has told this account, newest first, as the web's bell lists it, on a card that
 * rises over the page as the account does: rows of one grouped card, each with the poster of what
 * it is about or a mark for its kind of news. Each opens what it is about, where that is something a
 * phone shows, taking the card's place, and is read once opened. Everything can be marked read at
 * once, or, asked first, cleared.
 *
 * @param onOpen - Told to open the page a notification is about.
 * @param onJoin - Told to join the watch or listening party a notification asks them into.
 * @param onBack - Told somebody is done with them, or is leaving them to join a party.
 */
const TheNotifications = ({ onOpen, onJoin, onBack }: TheNotificationsProps) => {
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
    <Screen scrolls title={say('common.notifications')} onBack={onBack}>
      <Words size="title">{say('common.notifications')}</Words>

      {notifications.length === 0 ? null : (
        <View style={styles.actions}>
          <Button
            tone="ghost"
            onPress={() => {
              void markNotificationsRead().then(reread);
            }}
          >
            {say('common.markAllRead')}
          </Button>
          <Button tone="ghost" onPress={clearThemAll}>
            {say('common.clearAll')}
          </Button>
        </View>
      )}

      {inbox.isPending ? <ASpinner colour={colours.textMuted} /> : null}

      {inbox.isError ? <Words tone="danger">{say('common.thoseCouldNotBeRead')}</Words> : null}

      {!inbox.isPending && notifications.length === 0 ? (
        <ANothingHere of={Inbox} title={say('phone.theNotifications.nothingNew')} />
      ) : null}

      {notifications.length === 0 ? null : (
        <AGroup>
          {notifications.map((notification) => {
            const leads = whereANotificationLeads(notification.link);
            const invitation = readPartyInvitation(notification.link);

            return (
              <ANotification
                key={notification.id}
                notification={notification}
                now={now}
                onPress={() => {
                  void clearNotifications(notification.id).then(reread);

                  if (invitation !== null) {
                    onBack();
                    onJoin(invitation);

                    return;
                  }

                  if (leads !== null) {
                    onOpen(leads);
                  }
                }}
              />
            );
          })}
        </AGroup>
      )}
    </Screen>
  );
};

TheNotifications.displayName = 'TheNotifications';

export { TheNotifications };
