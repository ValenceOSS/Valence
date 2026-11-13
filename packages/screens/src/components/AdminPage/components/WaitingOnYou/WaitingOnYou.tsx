import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList as ClipboardListFilledIcon,
  Download as DownloadFilledIcon,
  HeartPulse as HeartPulseFilledIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Icon } from '@ValenceUI/Icon';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useAdminAttention } from '@ValenceScreens/admin/useAdminAttention';
import { say } from '@ValenceI18n/say';
import type { WaitingOnYouProps } from './WaitingOnYou.types';

type Waiting = {
  id: string;
  panel: string;
  icon: IconGlyph;
  label: string;
  count: number;
  isUrgent: boolean;
};

/**
 * What is waiting on an administrator, kept in the top bar of every admin page: requests to
 * approve, requests that failed and titles that need fixing, each a small button with its count
 * that opens the page it is dealt with on, each a segment of the bar's split button. Only what has something waiting is shown, so a bar with
 * nothing in it says everything is in hand; a newer release is left to the version beside it.
 *
 * @param onOpenPanel - Called with the page to open.
 */
const WaitingOnYou = ({ onOpenPanel }: WaitingOnYouProps) => {
  const attention = useAdminAttention();
  const requesting = useQuery(requestsQueries.availability());
  const hasRequests = requesting.data?.isEnabled ?? false;

  const waiting: Waiting[] = [
    ...(hasRequests
      ? [
          {
            id: 'requests',
            panel: 'requests',
            icon: ClipboardListFilledIcon,
            label: say('screens.adminArea.needsYouCard.requestsToApprove'),
            count: attention.requests,
            isUrgent: false,
          },
          {
            id: 'failedRequests',
            panel: 'catalogue',
            icon: DownloadFilledIcon,
            label: say('screens.adminArea.needsYouCard.failedRequests'),
            count: attention.failedRequests,
            isUrgent: true,
          },
        ]
      : []),
    {
      id: 'health',
      panel: 'media',
      icon: HeartPulseFilledIcon,
      label: say('screens.adminArea.needsYouCard.libraryProblems'),
      count: attention.health,
      isUrgent: false,
    },
  ].filter((one) => one.count > 0);

  if (waiting.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={say('screens.adminArea.needsYouCard.waitingOnYou')}
      className="flex shrink-0 items-stretch"
    >
      {waiting.map((one) => (
        <li key={one.id}>
          <Button
            variant="ghost"
            size="sm"
            label={one.label}
            onClick={() => {
              onOpenPanel(one.panel);
            }}
            className="gap-1.5 px-2"
          >
            <Icon of={one.icon} size={14} />
            <Badge size="count" tone={one.isUrgent ? 'danger' : 'quiet'}>
              <FormattedNumber value={one.count} />
            </Badge>
          </Button>
        </li>
      ))}
    </ul>
  );
};

WaitingOnYou.displayName = 'WaitingOnYou';

export { WaitingOnYou };
