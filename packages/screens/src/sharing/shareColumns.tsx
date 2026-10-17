import { Unlink as UnlinkIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { saidOpened } from '@ValenceClient/sharing/saidOpened';
import { shareStanding } from '@ValenceClient/sharing/shareStanding';
import { untilWhen } from '@ValenceClient/sharing/untilWhen';
import type { Share } from '@ValenceContracts/schemas/Share';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { say } from '@ValenceI18n/say';

/**
 * The columns of a list of shared links, the same in somebody's own links and in an administrator's
 * view of everybody's: what each opens and when it was made, whether it still works and until when,
 * how often it has been opened, and a way to withdraw one that still works.
 *
 * @param onWithdraw - Told which link somebody asked to withdraw.
 * @param after - Columns of the caller's own to set after the link itself, such as who made it.
 * @returns The columns.
 */
const shareColumns = <Row extends Share>(
  onWithdraw: (share: Row) => void,
  after: DataTableColumn<Row>[] = [],
): DataTableColumn<Row>[] => [
  {
    id: 'title',
    header: say('common.linkTo'),
    accessorFn: (share) => share.title,
    cell: ({ row }) => {
      const made = saidWhen(row.original.createdAt);

      return (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-text">{row.original.title}</span>

            {row.original.kind !== 'series' ? null : (
              <Badge size="sm">{say('common.wholeSeries')}</Badge>
            )}
          </span>

          <span className="truncate text-xs text-text-muted">
            {made === null ? null : say('common.madeCreatedAt', { createdAt: made })}
          </span>
        </span>
      );
    },
  },
  ...after,
  {
    id: 'standing',
    header: say('common.status'),
    accessorFn: (share) => shareStanding(share, Date.now()).label,
    cell: ({ row }) => {
      const standing = shareStanding(row.original, Date.now());

      return (
        <span className="flex min-w-0 flex-col items-start gap-1">
          <Badge size="sm" tone={standing.isLive ? 'accent' : 'quiet'}>
            {standing.label}
          </Badge>

          {standing.canWithdraw ? (
            <span className="truncate text-xs text-text-muted">{untilWhen(row.original)}</span>
          ) : null}
        </span>
      );
    },
  },
  {
    id: 'opened',
    meta: { hidesOnPhones: true },
    header: say('common.opened'),
    accessorFn: (share) => share.views,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-text-muted">{saidOpened(row.original)}</span>
    ),
  },
  {
    id: 'act',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      !shareStanding(row.original, Date.now()).canWithdraw ? null : (
        <span className="flex justify-end">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={say('common.withdrawTheLinkToTitle', { title: row.original.title })}
            onClick={() => {
              onWithdraw(row.original);
            }}
          >
            <Icon of={UnlinkIcon} size={16} />
          </Button>
        </span>
      ),
  },
];

export { shareColumns };
