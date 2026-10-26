import { cn } from '@ValenceUI/cn';
import { GROUP_LABEL } from '@ValenceUI/tokens/GROUP_LABEL';
import { useState } from 'react';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { Icon } from '@ValenceUI/Icon';
import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  CircleCheck as CircleCheckFilledIcon,
  CircleCheck as CircleCheckIcon,
  Download as DownloadIcon,
  Film as FilmIcon,
  Lock as LockIcon,
  MusicNote as MusicNoteIcon,
  Sparkles as SparklesIcon,
  Unlink as UnlinkIcon,
  Users as UsersIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Switch } from '@ValenceUI/Switch';
import { PanelCard } from '@ValenceUI/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { groupByDay } from '@ValenceScreens/components/NotificationBell/groupByDay';
import type { NotificationDay } from '@ValenceScreens/components/NotificationBell/groupByDay';
import type { NotificationEvent } from '@ValenceContracts/schemas/Notification';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import type { NotificationListProps } from './NotificationList.types';
import { say } from '@ValenceI18n/say';

const EVENT_ICONS: Record<NotificationEvent, IconGlyph> = {
  'media.added': FilmIcon,
  'party.invited': UsersIcon,
  'sharing.withdrawn': UnlinkIcon,
  'requests.available': CircleCheckIcon,
  'downloads.ready': DownloadIcon,
  'requests.albumsFound': MusicNoteIcon,
  'plugins.message': SparklesIcon,
  'profiles.pinLocked': LockIcon,
};

const DAY_NAMES: Record<NotificationDay, string> = {
  today: say('common.today'),
  yesterday: say('client.history.describeWhen.yesterday'),
  earlier: say('screens.collectionDialog.earlier'),
};

/**
 * The list behind the bell, on one card: what has happened, sorted under the day it arrived, with
 * only what has not been read a tab away, each with a mark for what kind of thing happened, and the
 * switch for having them pushed to this device even when the application is closed.
 *
 * @param notifications - What to show, newest first.
 * @param unread - How many have not been read.
 * @param push - Whether push is on for this device, and how to change it.
 * @param onRead - Told which notification was opened, which takes it off the bell.
 * @param onReadAll - Told to mark everything read.
 * @param onClearAll - Told to take everything off the bell, which is different from having read it.
 * @param onFollow - Told where a notification leads, when one is pressed.
 */
const NotificationList = ({
  notifications,
  unread,
  push,
  onRead,
  onReadAll,
  onClearAll,
  onFollow,
}: NotificationListProps) => {
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const [showing, setShowing] = useState('all');
  const shown =
    showing === 'unread' ? notifications.filter((one) => one.readAt === null) : notifications;

  return (
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
              <h4 className={cn('px-4 pb-1 pt-3', GROUP_LABEL)}>{DAY_NAMES[group.day]}</h4>

              <ul className="flex flex-col">
                {group.notifications.map((notification) => {
                  const isUnread = notification.readAt === null;

                  return (
                    <li
                      key={notification.id}
                      className="mx-3 my-1 overflow-hidden rounded-[1rem] border border-[var(--surface-line)]"
                    >
                      <Button
                        variant="row"
                        size="none"
                        className="items-start gap-3 p-3.5"
                        onClick={() => {
                          onRead(notification.id);

                          if (notification.link !== null) {
                            onFollow(notification.link);
                          }
                        }}
                      >
                        <span
                          className={
                            isUnread
                              ? 'flex size-9 shrink-0 items-center justify-center rounded-[0.625rem] border border-[var(--surface-line)] bg-[var(--surface-active)] text-text'
                              : 'flex size-9 shrink-0 items-center justify-center rounded-[0.625rem] border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text-muted'
                          }
                        >
                          <Icon of={EVENT_ICONS[notification.event]} size={16} />
                        </span>

                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span
                            className={
                              isUnread
                                ? 'text-[0.9375rem] font-medium leading-snug text-text'
                                : 'text-[0.9375rem] leading-snug text-text-muted'
                            }
                          >
                            {sayAgain(notification.title)}
                          </span>

                          <span className="text-[0.8125rem] leading-snug text-text-muted">
                            {sayAgain(notification.body)}
                          </span>

                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge size="sm" tone="quiet">
                              {describeSince(notification.createdAt, now)}
                            </Badge>

                            {isUnread ? (
                              <Badge size="sm" tone="quiet">
                                {say('screens.profileEditor.readProfileForm.new')}
                              </Badge>
                            ) : null}
                          </span>
                        </span>

                        {notification.link === null ? null : (
                          <span aria-hidden className="mt-0.5 shrink-0 text-text-muted">
                            <Icon of={ChevronRightIcon} size={15} />
                          </span>
                        )}
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
  );
};

NotificationList.displayName = 'NotificationList';

export { NotificationList };
