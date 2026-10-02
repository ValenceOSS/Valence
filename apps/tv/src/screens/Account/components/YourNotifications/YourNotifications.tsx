import { StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { markNotificationsRead } from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import { readArrivalLink } from '@ValenceTv/notifications/readArrivalLink';
import { readPartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import { tokens } from '@ValenceTv/theme/tokens';
import type { Notification } from '@ValenceContracts/schemas/Notification';
import type { YourNotificationsProps } from './YourNotifications.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';

const AT_MOST = 8;

/**
 * Says what a notice is about and when it came, as one line beneath its title.
 *
 * @param notice - The notice.
 * @param now - The time now, for how long ago it came.
 */
const detailOf = (notice: Notification, now: Date): string =>
  [sayAgain(notice.body), describeWhen(new Date(notice.createdAt), now)]
    .filter((part) => part !== '')
    .join(' · ');

/**
 * What this account has been told lately, on its account page, so a notice that came while nobody
 * was looking — or that went by on a banner — can still be read from the sofa. The newest come
 * first, unread ones marked, and choosing one that names a film or a programme opens it, reading it
 * as it does, and choosing an invitation joins the party it asks them into. Nothing is drawn where there has been nothing to tell. The list catches the remote
 * across the whole width of the page.
 *
 * @param onOpen - Told which film or programme a chosen notice names.
 * @param onJoin - Told which party a chosen invitation asks them into.
 * @param onFocus - Told when the remote comes onto the list.
 */
const YourNotifications = ({ onOpen, onJoin, onFocus }: YourNotificationsProps) => {
  const cache = useQueryClient();
  const inbox = useQuery(notificationQueries.inbox());
  const notices = (inbox.data?.notifications ?? []).slice(0, AT_MOST);

  if (notices.length === 0) {
    return null;
  }

  const now = new Date();
  const unread = notices.filter((notice) => notice.readAt === null);
  const reread = () => cache.invalidateQueries({ queryKey: notificationQueries.key });

  const choose = (notice: Notification) => {
    const named = readArrivalLink(notice.link);
    const invitation = readPartyInvitation(notice.link);

    if (notice.readAt === null) {
      void markNotificationsRead(notice.id).then(reread);
    }

    if (invitation !== null) {
      onJoin(invitation);

      return;
    }

    if (named !== null) {
      onOpen(named);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.notifications')}</Text>

      <TVFocusGuideView autoFocus style={styles.list}>
        {notices.map((notice) => (
          <Button
            key={notice.id}
            label={
              notice.readAt === null
                ? say('tv.account.yourNotifications.titleUnread', {
                    title: sayAgain(notice.title),
                  })
                : sayAgain(notice.title)
            }
            detail={detailOf(notice, now)}
            variant={notice.readAt === null ? 'secondary' : 'ghost'}
            isWide
            onFocus={onFocus}
            onPress={() => {
              choose(notice);
            }}
          />
        ))}

        {unread.length === 0 ? null : (
          <Button
            label={say('common.markAllRead')}
            variant="ghost"
            onFocus={onFocus}
            onPress={() => {
              void markNotificationsRead().then(reread);
            }}
          />
        )}
      </TVFocusGuideView>
    </View>
  );
};

YourNotifications.displayName = 'YourNotifications';

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: tokens.space.xs,
    marginTop: tokens.space.lg,
  },
  heading: {
    alignSelf: 'stretch',
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  list: { width: 760, gap: tokens.space.md, alignItems: 'center' },
});

export { YourNotifications };
