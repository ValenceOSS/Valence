import { Icon } from '@ValenceUI/Icon';
import { Inbox as InboxFilledIcon } from '@keyline-icons/react/fill';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Badge } from '@ValenceUI/Badge';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { NotificationList } from '@ValenceScreens/components/NotificationBell/components/NotificationList/NotificationList';
import type { NotificationBellProps } from './NotificationBell.types';
import { say } from '@ValenceI18n/say';

const COUNTED_UP_TO = 9;

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
}: NotificationBellProps) => (
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
        <Icon of={InboxFilledIcon} size={isInTheWindowBar ? 15 : 20} />

        {unread === 0 ? null : (
          <Badge
            tone="bright"
            size="sm"
            className={
              isInTheWindowBar
                ? 'absolute -top-1 -right-1.5 h-3.5 min-w-3.5 justify-center rounded-full px-1 text-[0.5625rem] leading-none ring-2 ring-[var(--frame-back)]'
                : 'absolute -top-1 -right-1 ring-2 ring-[var(--frame-back)]'
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
    <NotificationList
      notifications={notifications}
      unread={unread}
      {...(push === undefined ? {} : { push })}
      onRead={onRead}
      onReadAll={onReadAll}
      onClearAll={onClearAll}
      onFollow={onFollow}
    />
  </PopoverPanel>
);

NotificationBell.displayName = 'NotificationBell';

export { NotificationBell };
