import { Inbox, InboxDot } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheBellProps } from './TheBell.types';
import { say } from '@ValenceI18n/say';

const ROUND = 40;

const styles = StyleSheet.create({
  whole: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * The inbox that opens what the server has told this account, drawn with a dot while any of it is
 * unread. On glass where the phone has it, as the AirPlay button beside it is. The socket says when
 * something new arrives, so the inbox is not asked for on a timer.
 *
 * @param onPress - Told somebody wants to see them.
 */
const TheBell = ({ onPress }: TheBellProps) => {
  const colours = useTheColours();
  const inbox = useQuery(notificationQueries.inbox());
  const unread = inbox.data?.unread ?? 0;

  return (
    <Button
      tone="bare"
      label={
        unread === 0
          ? say('common.notifications')
          : say('phone.theBell.notificationsUnreadUnread', { unread: unread.toString() })
      }
      onPress={onPress}
    >
      <View style={styles.whole}>
        {hasLiquidGlass() ? <AGlass roundness={ROUND / 2} /> : null}
        <Icon of={unread === 0 ? Inbox : InboxDot} size={24} colour={colours.text} />
      </View>
    </Button>
  );
};

TheBell.displayName = 'TheBell';

export { TheBell };
