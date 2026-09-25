import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { Icon } from '@ValenceUI/Icon';
import { Info as InfoIcon, Unlink as UnlinkIcon } from '@keyline-icons/react';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Spinner } from '@ValenceUI/Spinner';
import { revokeAnybodysShare } from '@ValenceClient/sharing/fetchShares';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import { shareStanding } from '@ValenceClient/sharing/shareStanding';
import { untilWhen } from '@ValenceClient/sharing/untilWhen';
import { saidOpened } from '@ValenceClient/sharing/saidOpened';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { AdminShare } from '@ValenceContracts/schemas/Share';
import { say } from '@ValenceI18n/say';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';

/**
 * Every link this server has handed out, whoever handed it out: what each points at, who made it,
 * what will end it, how far through its allowance it is, and a way to withdraw it.
 *
 * Withdrawing somebody else's link tells them it happened and who did it. That is deliberate — a
 * link disappearing without a word is the kind of silent act that makes a shared server feel
 * arbitrary, and whoever made it is the one who has to explain to the person holding it.
 */
const SharesPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.shares());
  const [withdrawing, setWithdrawing] = useState<AdminShare | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const columns = useMemo<DataTableColumn<AdminShare>[]>(
    () => [
      {
        id: 'title',
        header: say('admin.sharesPanel.linkTo'),
        accessorFn: (share) => share.title,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-text">{row.original.title}</span>

              {row.original.kind !== 'series' ? null : (
                <Badge size="sm">{say('admin.sharesPanel.wholeSeries')}</Badge>
              )}
            </span>

            <span className="truncate text-xs text-text-muted">
              {say('admin.sharesPanel.made', { when: saidWhen(row.original.createdAt) })}
            </span>
          </span>
        ),
      },
      {
        id: 'createdBy',
        header: say('admin.sharesPanel.handedOutBy'),
        accessorFn: (share) => share.createdByName,
        cell: ({ row }) => (
          <span className="truncate text-sm text-text">{row.original.createdByName}</span>
        ),
      },
      {
        id: 'standing',
        header: say('admin.sharesPanel.standing'),
        accessorFn: (share) => shareStanding(share, Date.now()).label,
        cell: ({ row }) => {
          const standing = shareStanding(row.original, Date.now());

          return (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge size="sm" tone={standing.isLive ? 'accent' : 'quiet'}>
                {standing.label}
              </Badge>

              {!standing.isLive ? null : (
                <span className="truncate text-xs text-text-muted">{untilWhen(row.original)}</span>
              )}
            </span>
          );
        },
      },
      {
        id: 'opened',
        header: say('admin.sharesPanel.opened'),
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
                label={say('admin.sharesPanel.withdrawLabel', { title: row.original.title })}
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
    <PanelCard
      title={say('admin.sharesPanel.heading')}
      isFlush
      actions={
        <HoverCard
          side="bottom"
          align="end"
          detail={
            <p className="max-w-xs text-xs leading-relaxed">{say('admin.sharesPanel.about')}</p>
          }
        >
          <span className="text-text-muted hover:text-text">
            <Icon of={InfoIcon} size={14} label={say('admin.sharesPanel.aboutLabel')} />
          </span>
        </HoverCard>
      }
    >
      <ConfirmDialog
        title={say('admin.sharesPanel.withdrawTitle')}
        detail={
          withdrawing === null
            ? ''
            : say('admin.sharesPanel.withdrawDetail', {
                name: withdrawing.createdByName,
                title: withdrawing.title,
              })
        }
        confirmLabel={say('admin.sharesPanel.withdrawConfirm')}
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

          void revokeAnybodysShare(share.id)
            .then(async (revoked) => {
              tellOutcome(
                say('admin.sharesPanel.withdrew'),
                failureOfAnswer(revoked, say('admin.sharesPanel.couldNotWithdraw')),
              );

              return cache.invalidateQueries({ queryKey: adminQueries.shares().queryKey });
            })
            .finally(() => {
              setIsWorking(false);
              setWithdrawing(null);
            });
        }}
      />

      {asked.isError ? (
        <CouldNotRead
          what={say('admin.sharesPanel.theLinks')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner isCentered label={say('admin.sharesPanel.reading')} size="sm" />
      ) : (
        <DataTable
          label={say('admin.sharesPanel.tableLabel')}
          columns={columns}
          rows={asked.data}
          emptyMessage={say('admin.sharesPanel.empty')}
        />
      )}
    </PanelCard>
  );
};

SharesPanel.displayName = 'SharesPanel';

export { SharesPanel };
