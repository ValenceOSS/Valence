import { Icon } from '@ValenceUI/Icon';
import {
  CheckmarkCircle01Icon,
  Delete02Icon,
  Notification01Icon,
} from '@hugeicons/core-free-icons';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { Switch } from '@ValenceUI/Switch';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { NotificationBellProps } from './NotificationBell.types';

const COUNTED_UP_TO = 9;

/**
 * The bell in the dock and the list behind it: what has happened, what has not been read, and the
 * switch for having them pushed to this device even when the application is closed.
 *
 * @param notifications - What to show, newest first.
 * @param unread - How many have not been read, for the count on the bell.
 * @param push - Whether push is on for this device, and how to change it.
 * @param onOpen - Told when the list was opened.
 * @param onRead - Told which notification was read.
 * @param onReadAll - Told to mark everything read.
 * @param onClearAll - Told to take everything off the bell, which is different from having read it.
 * @param onFollow - Told where a notification leads, when one is pressed.
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
}: NotificationBellProps) => {
  const now = Date.now();

  return (
    <PopoverPanel
      label="Notifications"
      side="bottom"
      align="center"
      isBare
      onOpenChange={(isOpen) => {
        if (isOpen) {
          onOpen();
        }
      }}
      trigger={
        <span className="relative flex size-9 items-center justify-center">
          <Icon of={Notification01Icon} size={20} />

          {unread === 0 ? null : (
            <Badge tone="accent" size="sm" className="absolute -right-1 -top-1">
              {unread > COUNTED_UP_TO ? `${COUNTED_UP_TO.toString()}+` : unread.toString()}
            </Badge>
          )}
        </span>
      }
    >
      <PanelCard
        title="Notifications"
        isFlush
        className="w-96 max-w-[calc(100vw-2rem)]"
        actions={
          <>
            {unread === 0 ? null : (
              <PanelCardAction icon={CheckmarkCircle01Icon} onClick={onReadAll}>
                Mark all read
              </PanelCardAction>
            )}

            {notifications.length === 0 ? null : (
              <PanelCardAction icon={Delete02Icon} onClick={onClearAll}>
                Clear all
              </PanelCardAction>
            )}
          </>
        }
      >
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">
            Nothing yet. New films and episodes will show up here.
          </p>
        ) : (
          <ul className="flex max-h-96 flex-col divide-y divide-[var(--surface-line)] overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Button
                  variant="row"
                  size="none"
                  className="items-start gap-3 px-4 py-3"
                  onClick={() => {
                    onRead(notification.id);

                    if (notification.link !== null) {
                      onFollow(notification.link);
                    }
                  }}
                >
                  <span
                    aria-hidden
                    className={
                      notification.readAt === null
                        ? 'mt-1.5 size-2 shrink-0 rounded-full bg-accent'
                        : 'mt-1.5 size-2 shrink-0'
                    }
                  />

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex w-full items-baseline gap-2">
                      <span
                        className={
                          notification.readAt === null
                            ? 'truncate text-sm font-medium text-text'
                            : 'truncate text-sm text-text-muted'
                        }
                      >
                        {notification.title}
                      </span>

                      <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">
                        {describeSince(notification.createdAt, now)}
                      </span>
                    </span>

                    <span className="text-xs text-text-muted">{notification.body}</span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}

        {push === undefined ? null : (
          <div className="border-t border-[var(--surface-line)] px-4 py-3">
            <Switch
              label="Also send these to this device"
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
