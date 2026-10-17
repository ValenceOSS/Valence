import { useQuery } from '@tanstack/react-query';
import {
  CircleArrowDown as CircleArrowDownFilledIcon,
  CircleCheck as CircleCheckFilledIcon,
  ClipboardList as ClipboardListFilledIcon,
  Download as DownloadFilledIcon,
  HeartPulse as HeartPulseFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { DashboardRegion } from '@ValenceScreens/components/DashboardRegion/DashboardRegion';
import { useAdminAttention } from '@ValenceScreens/admin/useAdminAttention';
import { say } from '@ValenceI18n/say';
import type { NeedsYouCardProps } from './NeedsYouCard.types';

type Waiting = {
  id: string;
  panel: string;
  icon: IconGlyph;
  label: string;
  count: number | null;
  value?: string;
  isUrgent: boolean;
};

/**
 * What is waiting on an administrator, each a count that opens the page it is dealt with on:
 * requests to approve, downloads that failed, titles in the libraries that need fixing, and a newer
 * release. Failed jobs are left to the banner above, which already says so on every page. A count of nothing is shown quietly rather than hidden, so the card always reads the
 * same way and an empty one says everything is in hand.
 *
 * @param onOpenPanel - Called with the page to open.
 */
const NeedsYouCard = ({ onOpenPanel }: NeedsYouCardProps) => {
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
            id: 'downloads',
            panel: 'downloads',
            icon: DownloadFilledIcon,
            label: say('screens.adminArea.needsYouCard.downloadsThatFailed'),
            count: attention.downloads,
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
    {
      id: 'updates',
      panel: 'updates',
      icon: CircleArrowDownFilledIcon,
      label:
        attention.latest === null
          ? say('screens.adminArea.needsYouCard.valenceIsUpToDate')
          : say('screens.adminArea.needsYouCard.aNewReleaseIsOut'),
      count: null,
      ...(attention.latest === null ? {} : { value: attention.latest }),
      isUrgent: false,
    },
  ];

  return (
    <DashboardRegion title={say('screens.adminArea.needsYouCard.waitingOnYou')}>
      <ul
        className={cn(
          'grid grid-cols-2 gap-1 sm:grid-cols-3',
          waiting.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-2',
        )}
      >
        {waiting.map((one) => {
          const isQuiet = one.count === 0 || (one.count === null && attention.latest === null);

          return (
            <li key={one.id}>
              <Button
                variant="row"
                size="none"
                onClick={() => {
                  onOpenPanel(one.panel);
                }}
                className="h-auto flex-col items-start gap-2 px-3 py-2.5"
              >
                <span
                  className={cn(
                    'flex items-center gap-2 text-xs',
                    isQuiet ? 'text-text-muted' : one.isUrgent ? 'text-danger' : 'text-text',
                  )}
                >
                  <Icon of={one.icon} size={14} />
                  <span className="truncate">{one.label}</span>
                </span>

                <span
                  className={cn(
                    'text-xl font-semibold tabular-nums',
                    isQuiet ? 'text-text-muted' : 'text-[var(--card-title)]',
                  )}
                >
                  {one.count !== null ? (
                    <FormattedNumber value={one.count} />
                  ) : one.value === undefined ? (
                    <Icon of={CircleCheckFilledIcon} size={20} />
                  ) : (
                    one.value
                  )}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </DashboardRegion>
  );
};

NeedsYouCard.displayName = 'NeedsYouCard';

export { NeedsYouCard };
