import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus as CalendarPlusIcon,
  CircleCheck as CopiedIcon,
  Copy as CopyIcon,
  RefreshCw as RenewIcon,
  Unlink as TurnOffIcon,
} from '@keyline-icons/react';
import { calendarFeedAddress } from '@ValenceClient/calendar/calendarFeedAddress';
import { ensureCalendarFeed } from '@ValenceClient/calendar/ensureCalendarFeed';
import { renewCalendarFeed } from '@ValenceClient/calendar/renewCalendarFeed';
import { stopCalendarFeed } from '@ValenceClient/calendar/stopCalendarFeed';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Icon } from '@ValenceUI/Icon';
import { say } from '@ValenceI18n/say';
import type { CalendarSubscribeProps } from './CalendarSubscribe.types';

const GOOGLE_CALENDAR = 'https://calendar.google.com/calendar/render';

/**
 * Adds the release calendar to a calendar app in one go — the calendar app on this device, Google
 * Calendar, or a link copied for anything else — and looks after the link those apps read it by.
 *
 * There is no link to make first: the person's own link is fetched as the menu opens, made for them
 * if they have none, and is the same link every time, so adding the calendar on a second device
 * does not stop it on the first. The ways to add it wait for the link, so each acts on the press
 * itself, which a browser asks of anything opening a window, and the link is only ever the one the
 * server last said, so one replaced elsewhere is never handed out. Once they have one, the menu says when a calendar app last read
 * it, and offers to replace it, for a link that has been shared, or turn it off — each asked about
 * first, since either stops every subscription to it. In the desktop app the subscription is handed
 * to the system, which opens the calendar app it belongs to.
 *
 * @param className - Extra classes for the caller's own layout.
 */
const CalendarSubscribe = ({ className }: CalendarSubscribeProps) => {
  const cache = useQueryClient();
  const asked = useQuery(calendarQueries.feed());
  const [hasCopied, setHasCopied] = useState(false);
  const [asking, setAsking] = useState<'renew' | 'stop' | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const feed = asked.data ?? null;
  const known = feed?.token ?? null;
  const origin = window.location.origin;
  const readAt = feed === null || feed.lastReadAt === null ? null : saidWhen(feed.lastReadAt);

  const reread = () => cache.invalidateQueries({ queryKey: calendarQueries.feed().queryKey });

  const ready = async () => {
    if (known !== null) {
      return;
    }

    const made = await ensureCalendarFeed();

    if (made !== null) {
      cache.setQueryData(calendarQueries.feed().queryKey, made);
    }
  };

  const withLink = (act: (link: string) => void) => {
    if (known !== null) {
      act(known);
    }
  };

  const change = async (doing: () => Promise<boolean>) => {
    setIsWorking(true);

    const isDone = await doing();

    setIsWorking(false);
    setHasFailed(!isDone);

    if (isDone) {
      setAsking(null);
      await reread();
    }
  };

  return (
    <>
      <ActionMenu
        label={say('common.addToCalendar')}
        look="segment"
        align="end"
        {...(className === undefined ? {} : { className })}
        onOpenChange={(isOpen) => {
          setHasCopied(false);

          if (isOpen) {
            void ready();
          }
        }}
        trigger={
          <span className="flex items-center gap-1.5">
            <Icon of={CalendarPlusIcon} size={16} />
            {say('common.addToCalendar')}
          </span>
        }
        groups={[
          {
            items: [
              {
                id: 'device',
                label: say('common.appleCalendarOrOutlook'),
                isDisabled: known === null,
                onChoose: () => {
                  withLink((link) => {
                    const subscription = calendarFeedAddress(link, origin, true);

                    if (platformInUse().thisClientKind() === 'desktop') {
                      window.open(subscription, '_blank', 'noopener');

                      return;
                    }

                    window.location.assign(subscription);
                  });
                },
              },
              {
                id: 'google',
                label: say('common.googleCalendar'),
                isDisabled: known === null,
                onChoose: () => {
                  withLink((link) => {
                    const cid = new URLSearchParams({
                      cid: calendarFeedAddress(link, origin, true),
                    });

                    window.open(`${GOOGLE_CALENDAR}?${cid.toString()}`, '_blank', 'noopener');
                  });
                },
              },
              {
                id: 'copy',
                label: hasCopied ? say('common.copied') : say('common.copyLink'),
                isDisabled: known === null,
                icon: <Icon of={hasCopied ? CopiedIcon : CopyIcon} size={15} />,
                keepsOpen: true,
                onChoose: () => {
                  withLink((link) => {
                    void navigator.clipboard
                      .writeText(calendarFeedAddress(link, origin))
                      .then(() => {
                        setHasCopied(true);
                      });
                  });
                },
              },
            ],
          },
          ...(feed === null
            ? []
            : [
                {
                  name: say('common.calendarLink'),
                  items: [
                    {
                      id: 'renew',
                      label: say('common.makeANewLink'),
                      detail:
                        readAt === null
                          ? say('common.notReadByACalendarApp')
                          : say('common.lastReadLastReadAt', { lastReadAt: readAt }),
                      icon: <Icon of={RenewIcon} size={15} />,
                      onChoose: () => {
                        setAsking('renew');
                      },
                    },
                    {
                      id: 'stop',
                      label: say('common.turnOff'),
                      icon: <Icon of={TurnOffIcon} size={15} />,
                      isDestructive: true,
                      onChoose: () => {
                        setAsking('stop');
                      },
                    },
                  ],
                },
              ]),
        ]}
      />

      <ConfirmDialog
        title={
          asking === 'stop'
            ? say('common.turnOffYourCalendarLink')
            : say('common.makeANewCalendarLink')
        }
        detail={
          hasFailed
            ? say('common.theCalendarLinkCouldNotBeChanged')
            : asking === 'stop'
              ? say('common.calendarAppsSubscribedToIt')
              : say('common.theLinkYouHaveNowStops')
        }
        confirmLabel={asking === 'stop' ? say('common.turnOff') : say('common.makeANewLink')}
        isDestructive
        isBusy={isWorking}
        isOpen={asking !== null}
        onClose={() => {
          setAsking(null);
          setHasFailed(false);
        }}
        onConfirm={() => {
          void change(
            asking === 'stop' ? stopCalendarFeed : async () => (await renewCalendarFeed()) !== null,
          );
        }}
      />
    </>
  );
};

CalendarSubscribe.displayName = 'CalendarSubscribe';

export { CalendarSubscribe };
