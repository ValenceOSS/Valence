import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Share, StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus as CalendarPlusIcon,
  Globe as GlobeIcon,
  RefreshCw as RenewIcon,
  Share as ShareIcon,
  Unlink as TurnOffIcon,
} from '@keyline-icons/react-native';
import { calendarFeedAddress } from '@ValenceClient/calendar/calendarFeedAddress';
import { ensureCalendarFeed } from '@ValenceClient/calendar/ensureCalendarFeed';
import { renewCalendarFeed } from '@ValenceClient/calendar/renewCalendarFeed';
import { stopCalendarFeed } from '@ValenceClient/calendar/stopCalendarFeed';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ACalendarSubscribeSheetProps } from './ACalendarSubscribeSheet.types';
import { say } from '@ValenceI18n/say';

const GOOGLE_CALENDAR = 'https://calendar.google.com/calendar/render';

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 14, padding: 14 },
  said: { gap: 2, paddingHorizontal: 16, paddingVertical: 12 },
  whole: { gap: 16 },
  waiting: { alignItems: 'center', gap: 12, padding: 20 },
});

/**
 * A sheet that adds the release calendar to a calendar app, as the web's Add to Calendar menu does:
 * the calendar on this phone, Google Calendar, or the link handed to another app through the
 * phone's share sheet, which can also copy it. The person's link is fetched as the sheet opens, and
 * made for them where they have none; it is the same link on every device, so adding the calendar
 * here does not stop it anywhere else. The sheet is put away once a way to add it is chosen.
 *
 * Beneath, the link itself is looked after: when a calendar app last read it, and ways to replace
 * it, for a link that has been shared, or turn it off — each asked about first, since either stops
 * every subscription to it.
 *
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const ACalendarSubscribeSheet = ({ isOpen, onClose }: ACalendarSubscribeSheetProps) => {
  const colours = useTheColours();
  const cache = useQueryClient();
  const asked = useQuery({ ...calendarQueries.feed(), enabled: isOpen });
  const [hasFailed, setHasFailed] = useState(false);
  const feed = asked.data ?? null;
  const token = feed?.token ?? null;
  const readAt = feed === null || feed.lastReadAt === null ? null : saidWhen(feed.lastReadAt);
  const origin = platformInUse().serverAddress();
  const lacks = isOpen && asked.isSuccess && (asked.data?.token ?? null) === null;

  useEffect(() => {
    if (!lacks || hasFailed) {
      return;
    }

    void ensureCalendarFeed().then((made) => {
      if (made === null) {
        setHasFailed(true);

        return;
      }

      cache.setQueryData(calendarQueries.feed().queryKey, made);
    });
  }, [lacks, hasFailed, cache]);

  /**
   * Asks whether to do something to the link, does it if so, and says when it did not work. Either
   * way the sheet stays out, showing the link as it now is.
   *
   * @param asking - What to ask, and what the yes button says.
   * @param doing - What to do, answering whether it worked.
   */
  const confirm = (
    asking: { title: string; detail: string; yes: string },
    doing: () => Promise<boolean>,
  ) => {
    Alert.alert(asking.title, asking.detail, [
      { text: say('common.keepIt'), style: 'cancel' },
      {
        text: asking.yes,
        style: 'destructive',
        onPress: () => {
          void doing().then(async (isDone) => {
            if (!isDone) {
              Alert.alert(say('common.theCalendarLinkCouldNotBeChanged'));

              return;
            }

            await cache.invalidateQueries({ queryKey: calendarQueries.feed().queryKey });
          });
        },
      },
    ]);
  };

  const address = (asSubscription: boolean) =>
    token === null || origin === null ? null : calendarFeedAddress(token, origin, asSubscription);

  /**
   * One way to add the calendar.
   *
   * @param way - What it is called, how it is drawn, and what choosing it does with the link.
   * @returns Its row.
   */
  const aRow = (way: {
    id: string;
    label: string;
    of: AGlyph;
    ink?: string;
    act: (link: { subscription: string; page: string }) => void;
    isKeptOpen?: boolean;
  }) => (
    <Button
      key={way.id}
      tone="bare"
      label={way.label}
      onPress={() => {
        const subscription = address(true);
        const page = address(false);

        if (subscription !== null && page !== null) {
          way.act({ subscription, page });

          if (way.isKeptOpen !== true) {
            onClose();
          }
        }
      }}
    >
      <View style={styles.row}>
        <Icon of={way.of} size={22} colour={way.ink ?? colours.text} />
        <Words {...(way.ink === undefined ? {} : { colour: way.ink })}>{way.label}</Words>
      </View>
    </Button>
  );

  return (
    <ASheet isOpen={isOpen} title={say('common.addToCalendar')} onClose={onClose}>
      <View style={styles.whole}>
        <Words tone="muted">{say('common.subscribeToYourReleaseCalendar')}</Words>

        {token === null && hasFailed ? (
          <View style={styles.waiting}>
            <Words tone="danger" isCentred>
              {say('common.theCalendarLinkCouldNotBeMade')}
            </Words>
            <Button
              tone="quiet"
              onPress={() => {
                setHasFailed(false);
              }}
            >
              {say('common.tryAgain')}
            </Button>
          </View>
        ) : token === null ? (
          <View style={styles.waiting}>
            <ActivityIndicator color={colours.textMuted} />
          </View>
        ) : (
          <AGroup>
            {aRow({
              id: 'phone',
              label: say('common.appleCalendarOrOutlook'),
              of: CalendarPlusIcon,
              act: ({ subscription }) => {
                void Linking.openURL(subscription);
              },
            })}
            {aRow({
              id: 'google',
              label: say('common.googleCalendar'),
              of: GlobeIcon,
              act: ({ subscription }) => {
                void Linking.openURL(
                  `${GOOGLE_CALENDAR}?${new URLSearchParams({ cid: subscription }).toString()}`,
                );
              },
            })}
            {aRow({
              id: 'share',
              label: say('common.shareLink'),
              of: ShareIcon,
              act: ({ page }) => {
                void Share.share({ url: page, message: page });
              },
            })}
          </AGroup>
        )}

        {feed === null || token === null ? null : (
          <AGroup title={say('common.calendarLink')}>
            <View style={styles.said}>
              <Words size="small" tone="muted">
                {readAt === null
                  ? say('common.notReadByACalendarApp')
                  : say('common.lastReadLastReadAt', { lastReadAt: readAt })}
              </Words>
            </View>
            {aRow({
              id: 'renew',
              label: say('common.makeANewLink'),
              of: RenewIcon,
              isKeptOpen: true,
              act: () => {
                confirm(
                  {
                    title: say('common.makeANewCalendarLink'),
                    detail: say('common.theLinkYouHaveNowStops'),
                    yes: say('common.makeANewLink'),
                  },
                  async () => (await renewCalendarFeed()) !== null,
                );
              },
            })}
            {aRow({
              id: 'stop',
              label: say('common.turnOff'),
              of: TurnOffIcon,
              ink: colours.danger,
              act: () => {
                confirm(
                  {
                    title: say('common.turnOffYourCalendarLink'),
                    detail: say('common.calendarAppsSubscribedToIt'),
                    yes: say('common.turnOff'),
                  },
                  stopCalendarFeed,
                );
              },
            })}
          </AGroup>
        )}
      </View>
    </ASheet>
  );
};

ACalendarSubscribeSheet.displayName = 'ACalendarSubscribeSheet';

export { ACalendarSubscribeSheet };
