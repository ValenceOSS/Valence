import { Bell } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheBellProps } from './TheBell.types';

const ROUND = 40;

const DOT = 10;

const styles = StyleSheet.create({
  dot: { borderRadius: DOT / 2, height: DOT, position: 'absolute', right: 7, top: 7, width: DOT },
  whole: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * The bell that opens what the server has told this account, with a dot on it while any of it is
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
      label={unread === 0 ? 'Notifications' : `Notifications, ${unread.toString()} unread`}
      onPress={onPress}
    >
      <View style={styles.whole}>
        {hasLiquidGlass() ? <AGlass roundness={ROUND / 2} /> : null}
        <Icon of={Bell} size={20} colour={colours.text} />
        {unread === 0 ? null : <View style={[styles.dot, { backgroundColor: colours.accent }]} />}
      </View>
    </Button>
  );
};

TheBell.displayName = 'TheBell';

export { TheBell };
