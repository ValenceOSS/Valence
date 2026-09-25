import { say } from '@ValenceI18n/say';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { Unlink as UnlinkIcon } from '@keyline-icons/react';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Spinner } from '@ValenceUI/Spinner';
import { revokeShare } from '@ValenceClient/sharing/fetchShares';
import { shareQueries } from '@ValenceClient/query/shareQueries';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { shareStanding } from '@ValenceClient/sharing/shareStanding';
import { untilWhen } from '@ValenceClient/sharing/untilWhen';
import { saidOpened } from '@ValenceClient/sharing/saidOpened';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Share } from '@ValenceContracts/schemas/Share';

/**
 * The links this account has handed out: what each points at, when it was made, what will end it,
 * how far through its allowance it is, and a way to withdraw it.
 *
 * A withdrawn link stays in the list rather than disappearing. Somebody who has just withdrawn one
 * wants to see that it happened, and a link that ended on its own is the same kind of fact.
 */
const SharePanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(shareQueries.mine());
  const [withdrawing, setWithdrawing] = useState<Share | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const columns = useMemo<DataTableColumn<Share>[]>(
    () => [
      {
        id: 'title',
        header: say('screens.sharePanel.linkToHeader'),
        accessorFn: (share) => share.title,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.title}</span>

              {row.original.kind !== 'series' ? null : (
                <Badge size="sm">{say('screens.sharePanel.wholeSeries')}</Badge>
              )}
            </span>

            <span className="truncate text-xs text-text-muted">
              {say('screens.sharePanel.madeWhen', { when: saidWhen(row.original.createdAt) })}
            </span>
          </span>
        ),
      },
      {
        id: 'standing',
        header: say('screens.sharePanel.standingHeader'),
        accessorFn: (share) => shareStanding(share, Date.now()).label,
        cell: ({ row }) => {
          const standing = shareStanding(row.original, Date.now());

          return (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={standing.isLive ? 'accent' : 'quiet'}>
                {standing.label}
              </Badge>

              {standing.label !== 'Live' ? null : (
                <span className="truncate text-xs text-text-muted">{untilWhen(row.original)}</span>
              )}
            </span>
          );
        },
      },
      {
        id: 'opened',
        header: say('screens.sharePanel.openedHeader'),
        accessorFn: (share) => share.views,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-text-muted">
            {saidOpened(row.original)}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isSpent ? null : (
            <span className="flex justify-end">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                label={say('screens.sharePanel.withdrawLabel', { title: row.original.title })}
                onClick={() => {
                  setWithdrawing(row.original);
                }}
              >
                <Icon of={UnlinkIcon} size={16} />
              </Button>
            </span>
          ),
      },
    ],
    [],
  );

  return (
    <PanelCard title={say('screens.sharePanel.heading')} isFlush>
      <ConfirmDialog
        title={say('screens.sharePanel.withdrawTitle')}
        detail={
          withdrawing === null
            ? ''
            : say('screens.sharePanel.withdrawBody', { title: withdrawing.title })
        }
        confirmLabel={say('screens.sharePanel.withdrawConfirm')}
        isDestructive
        isBusy={isWorking}
        isOpen={withdrawing !== null}
        onClose={() => {
          setWithdrawing(null);
        }}
        onConfirm={() => {
          const share = withdrawing;

          if (share === null) {
            return;
          }

          setIsWorking(true);

          void revokeShare(share.id)
            .then(async () => cache.invalidateQueries({ queryKey: shareQueries.key }))
            .finally(() => {
              setIsWorking(false);
              setWithdrawing(null);
            });
        }}
      />

      <p className="px-4 pt-4 text-sm text-text-muted">{say('screens.sharePanel.lede')}</p>

      {asked.isError ? (
        <CouldNotRead
          what={say('screens.sharePanel.heading')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner isCentered label={say('screens.sharePanel.loading')} size="sm" />
      ) : (
        <DataTable
          label={say('screens.sharePanel.tableLabel')}
          columns={columns}
          rows={asked.data}
          emptyMessage={say('screens.sharePanel.empty')}
        />
      )}
    </PanelCard>
  );
};

SharePanel.displayName = 'SharePanel';

export { SharePanel };
