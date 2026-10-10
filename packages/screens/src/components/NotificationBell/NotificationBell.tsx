import { useState } from 'react';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { Icon } from '@ValenceUI/Icon';
import {
  Bell as BellFilledIcon,
  Inbox as InboxFilledIcon,
  Bin as BinFilledIcon,
  CircleCheck as CircleCheckFilledIcon,
  CircleCheck as CircleCheckIcon,
  Download as DownloadIcon,
  Film as FilmIcon,
  MusicNote as MusicNoteIcon,
  Sparkles as SparklesIcon,
  Unlink as UnlinkIcon,
  Users as UsersIcon,
} from '@keyline-icons/react/fill';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { Switch } from '@ValenceUI/Switch';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { groupByDay } from './groupByDay';
import type { NotificationEvent } from '@ValenceContracts/schemas/Notification';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { NotificationDay } from './groupByDay';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { NotificationBellProps } from './NotificationBell.types';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';

const COUNTED_UP_TO = 9;

const EVENT_ICONS: Record<NotificationEvent, IconGlyph> = {
  'media.added': FilmIcon,
  'party.invited': UsersIcon,
  'sharing.withdrawn': UnlinkIcon,
  'requests.available': CircleCheckIcon,
  'downloads.ready': DownloadIcon,
  'requests.albumsFound': MusicNoteIcon,
  'plugins.message': SparklesIcon,
};

const DAY_NAMES: Record<NotificationDay, string> = {
  today: say('common.today'),
  yesterday: say('client.history.describeWhen.yesterday'),
  earlier: say('screens.collectionDialog.earlier'),
};

/**
 * The bell in the dock and the list behind it, on one card: what has happened, sorted under the day
 * it arrived, with only what has not been read a tab away, each with a mark for what kind of thing
 * happened, and the switch for having them pushed to this device even when the application is
 * closed.
 *
 * @param notifications - What to show, newest first.
 * @param unread - How many have not been read, for the count on the bell.
 * @param push - Whether push is on for this device, and how to change it.
 * @param onOpen - Told when the list was opened.
 * @param onRead - Told which notification was opened, which takes it off the bell.
 * @param onReadAll - Told to mark everything read.
 * @param onClearAll - Told to take everything off the bell, which is different from having read it.
 * @param onFollow - Told where a notification leads, when one is pressed.
 * @param isInTheWindowBar - Whether it sits in the desktop's window bar, where it is an inbox the
 *   size of the bar's other icons rather than the dock's bell.
 */
const NotificationBell = ({
  notifications,
  unread,
  push,
  onOpen,
  onRead,
  onReadAll,
  onClearAll,
  onFollow,
  isInTheWindowBar = false,
}: NotificationBellProps) => {
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const [showing, setShowing] = useState('all');
  const shown =
    showing === 'unread' ? notifications.filter((one) => one.readAt === null) : notifications;

  return (
    <PopoverPanel
      label={say('common.notifications')}
      side="bottom"
      align="center"
      hasSurface={false}
      isBare={!isInTheWindowBar}
      isOverDialogs={isInTheWindowBar}
      triggerLook={isInTheWindowBar ? 'smallIcon' : 'icon'}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          onOpen();
        }
      }}
      trigger={
        <span
          className={
            isInTheWindowBar
              ? 'relative flex size-6 items-center justify-center'
              : 'relative flex size-9 items-center justify-center'
          }
        >
          <Icon
            of={isInTheWindowBar ? InboxFilledIcon : BellFilledIcon}
            size={isInTheWindowBar ? 15 : 20}
          />

          {unread === 0 ? null : (
            <Badge
              tone="accent"
              size="sm"
              className={
                isInTheWindowBar
                  ? 'absolute -right-2 -top-1.5 scale-75'
                  : 'absolute -right-1 -top-1'
              }
            >
              <FormattedNumber
                value={Math.min(unread, COUNTED_UP_TO)}
                {...(unread > COUNTED_UP_TO ? { suffix: '+' } : {})}
              />
            </Badge>
          )}
        </span>
      }
    >
      <PanelCard
        title={say('common.notifications')}
        isFlush
        className="w-[26rem] max-w-[calc(100vw-2rem)]"
        actions={
          <>
            {unread === 0 ? null : (
              <PanelCardAction icon={CircleCheckFilledIcon} onClick={onReadAll}>
                {say('common.markAllRead')}
              </PanelCardAction>
            )}

            {notifications.length === 0 ? null : (
              <PanelCardAction icon={BinFilledIcon} onClick={onClearAll}>
                {say('common.clearAll')}
              </PanelCardAction>
            )}
          </>
        }
      >
        <Tabs value={showing} onValueChange={setShowing}>
          <TabRow
            label={say('common.notifications')}
            tone="underlined"
            size="sm"
            value={showing}
            groups={[
              {
                items: [
                  { id: 'all', label: say('common.all') },
                  { id: 'unread', label: say('screens.notificationBell.unread') },
                ],
              },
            ]}
            className="px-4 pt-1"
          />
        </Tabs>

        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            {showing === 'unread'
              ? say('screens.notificationBell.everythingHasBeenRead')
              : say('screens.notificationBell.nothingYetNewFilmsAndEpisodes')}
          </p>
        ) : (
          <div className="flex max-h-96 flex-col overflow-y-auto pb-1">
            {groupByDay(shown, now).map((group) => (
              <section key={group.day} className="flex flex-col">
                <h4 className="px-4 pb-1 pt-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-text-muted">
                  {DAY_NAMES[group.day]}
                </h4>

                <ul className="flex flex-col">
                  {group.notifications.map((notification) => {
                    const isUnread = notification.readAt === null;

                    return (
                      <li key={notification.id}>
                        <Button
                          variant="row"
                          size="none"
                          className="items-start gap-3 px-4 py-2.5"
                          onClick={() => {
                            onRead(notification.id);

                            if (notification.link !== null) {
                              onFollow(notification.link);
                            }
                          }}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)] text-text-muted">
                            <Icon of={EVENT_ICONS[notification.event]} size={16} />
                          </span>

                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span
                              className={
                                isUnread
                                  ? 'text-sm font-medium leading-snug text-text'
                                  : 'text-sm leading-snug text-text-muted'
                              }
                            >
                              {sayAgain(notification.title)}
                            </span>

                            <span className="text-xs leading-snug text-text-muted">
                              {sayAgain(notification.body)}
                            </span>

                            <span className="text-xs tabular-nums text-text-muted/80">
                              {describeSince(notification.createdAt, now)}
                            </span>
                          </span>

                          <span
                            aria-hidden
                            className={
                              isUnread
                                ? 'mt-1.5 size-2 shrink-0 rounded-full bg-accent'
                                : 'mt-1.5 size-2 shrink-0'
                            }
                          />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {push === undefined ? null : (
          <div className="border-t border-[var(--surface-line)] px-4 py-3">
            <Switch
              label={say('screens.notificationBell.alsoSendTheseToThisDevice')}
              isOn={push.isOn}
              onToggle={push.onToggle}
            />
          </div>
        )}
      </PanelCard>
    </PopoverPanel>
  );
};

NotificationBell.displayName = 'NotificationBell';

export { NotificationBell };
