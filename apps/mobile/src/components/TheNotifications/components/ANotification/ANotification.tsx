import {
  CircleCheck,
  Download,
  Lock,
  MusicNote,
  Puzzle,
  Tv,
  Unlink,
  Users,
} from '@keyline-icons/react-native/fill';
import { StyleSheet, Text, View } from 'react-native';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import type { NotificationEvent } from '@ValenceContracts/schemas/Notification';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import { whereANotificationLeads } from '@ValenceMobile/components/TheNotifications/whereANotificationLeads';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ANotificationProps } from './ANotification.types';
import { sayAgain } from '@ValenceI18n/sayAgain';

const PICTURE = 46;

const DOT = 8;

const MARKS: Readonly<Record<NotificationEvent, AGlyph>> = {
  'media.added': Tv,
  'party.invited': Users,
  'sharing.withdrawn': Unlink,
  'requests.available': CircleCheck,
  'downloads.ready': Download,
  'requests.albumsFound': MusicNote,
  'plugins.message': Puzzle,
  'profiles.pinLocked': Lock,
};

const styles = StyleSheet.create({
  dot: { borderRadius: DOT / 2, height: DOT, width: DOT },
  mark: {
    alignItems: 'center',
    borderRadius: PICTURE / 2,
    height: PICTURE,
    justifyContent: 'center',
    width: PICTURE,
  },
  poster: { borderRadius: 8, height: PICTURE * 1.5, width: PICTURE },
  row: { alignItems: 'center', flexDirection: 'row', gap: 14, padding: 14 },
  side: { alignItems: 'flex-end', alignSelf: 'stretch', gap: 8 },
  when: { fontFamily: FONTS.sans.medium, fontSize: 12 },
  words: { flex: 1, gap: 3 },
});

/**
 * One thing the server told this account, as a row of a grouped card: the poster of the film it is
 * about, or a quiet mark for the kind of news it is; what happened, bold while unread, with the line
 * about it beneath; and in the corner how long ago, over a dot while it is unread.
 *
 * @param notification - What was said.
 * @param now - The time it is now, to say how long ago it was.
 * @param onPress - Told it was pressed.
 */
const ANotification = ({ notification, now, onPress }: ANotificationProps) => {
  const colours = useTheColours();
  const leads = whereANotificationLeads(notification.link);
  const isUnread = notification.readAt === null;
  const title = sayAgain(notification.title);

  return (
    <Button tone="bare" label={title} onPress={onPress}>
      <View style={styles.row}>
        {leads?.kind === 'title' ? (
          <ARemotePicture
            style={[styles.poster, { backgroundColor: colours.surfaceRaised }]}
            uri={onThisServer(artworkUrl(leads.mediaId, 'poster', { size: 'small' }))}
          />
        ) : (
          <View style={[styles.mark, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
            <Icon of={MARKS[notification.event]} size={20} colour={colours.text} />
          </View>
        )}

        <View style={styles.words}>
          <Words isStrong={isUnread} lines={2}>
            {title}
          </Words>
          <Words size="small" tone="muted" lines={2}>
            {sayAgain(notification.body)}
          </Words>
        </View>

        <View style={styles.side}>
          <Text style={[styles.when, { color: colours.textMuted }]}>
            {describeWhen(new Date(notification.createdAt), now)}
          </Text>
          {isUnread ? <View style={[styles.dot, { backgroundColor: colours.accent }]} /> : null}
        </View>
      </View>
    </Button>
  );
};

ANotification.displayName = 'ANotification';

export { ANotification };
