import { Unlink as UnlinkIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { nameOfAsker } from '@ValenceContracts/functions/nameOfAsker';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Spinner } from '@ValenceUI/Spinner';
import { Button } from '@ValenceUI/Button';
import { shareStanding } from '@ValenceClient/sharing/shareStanding';
import { revokeAnybodysShare } from '@ValenceClient/sharing/fetchShares';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { AdminShare } from '@ValenceContracts/schemas/Share';
import { PanelCard } from '@ValenceUI/PanelCard';
import { say } from '@ValenceI18n/say';
import { describeShareOpens } from './describeShareOpens';
import { describeShareStatus } from './describeShareStatus';

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
  const [view, setView] = useState('active');
  const live = (asked.data ?? []).filter((share) => shareStanding(share, Date.now()).isLive);
  const endedShares = (asked.data ?? []).filter(
    (share) => !shareStanding(share, Date.now()).isLive,
  );

  const accountsAsked = useQuery(adminQueries.accounts());
  const accounts = new Map((accountsAsked.data ?? []).map((account) => [account.id, account]));
  const now = Date.now();
  const pictureOf = (share: AdminShare) =>
    share.bookId !== null
      ? bookCoverUrl(share.bookId)
      : artworkUrl(share.seriesId ?? share.mediaId ?? '', 'poster', {
          isOfTitle: true,
          size: 'small',
        });

  const columns: DataTableColumn<AdminShare>[] = [
    {
      id: 'title',
      header: say('common.title'),
      accessorFn: (share) => share.title,
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-3">
          <img
            src={pictureOf(row.original)}
            alt=""
            loading="lazy"
            className="aspect-[2/3] w-7 shrink-0 rounded bg-[var(--surface-hover)] object-cover"
          />
          <span className="flex min-w-0 max-w-[22rem] flex-col">
            <span className="truncate font-medium text-text">{row.original.title}</span>
            {row.original.kind === 'series' ? (
              <span className="text-xs text-text-muted">{say('common.wholeSeries')}</span>
            ) : row.original.episode === null ? null : (
              <span className="truncate text-xs text-text-muted">
                {[
                  row.original.episode.seasonNumber === null ||
                  row.original.episode.episodeNumber === null
                    ? null
                    : say('client.calendar.describeCalendarEntry.sSeasonNumberEEpisodeNumber', {
                        seasonNumber: row.original.episode.seasonNumber,
                        episodeNumber: row.original.episode.episodeNumber,
                      }),
                  row.original.episode.title,
                ]
                  .filter((part) => part !== null && part !== '')
                  .join(' · ')}
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      id: 'createdBy',
      meta: { hidesOnPhones: true },
      header: say('screens.adminArea.sharesPanel.handedOutBy'),
      accessorFn: (share) =>
        nameOfAsker({ profileName: share.createdByProfileName, household: share.createdByName }),
      cell: ({ row }) => {
        const account = accounts.get(row.original.createdBy);

        return (
          <span className="flex min-w-0 items-center gap-2">
            {account === undefined ? null : (
              <span className="flex shrink-0 [&>*]:!size-6">
                <AccountFace account={account} />
              </span>
            )}
            <span className="truncate text-text">
              {nameOfAsker({
                profileName: row.original.createdByProfileName,
                household: row.original.createdByName,
              })}
            </span>
          </span>
        );
      },
    },
    {
      id: 'status',
      header: say('common.status'),
      accessorFn: (share) => describeShareStatus(share, now),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {describeShareStatus(row.original, now)}
        </span>
      ),
    },
    {
      id: 'opened',
      header: say('common.opened'),
      accessorFn: (share) => share.views,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-text-muted">
          {describeShareOpens(row.original)}
        </span>
      ),
    },
    {
      id: 'created',
      meta: { hidesOnPhones: true },
      header: say('screens.adminArea.sharesPanel.created'),
      accessorFn: (share) => share.createdAt,
      cell: ({ row }) => (
        <span
          className="whitespace-nowrap text-text-muted"
          title={new Date(row.original.createdAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        >
          {describeSince(row.original.createdAt, now)}
        </span>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) =>
        !shareStanding(row.original, now).canWithdraw ? (
          <span aria-hidden className="block size-8" />
        ) : (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={say('common.withdrawTheLinkToTitle', { title: row.original.title })}
            onClick={() => {
              setWithdrawing(row.original);
            }}
          >
            <Icon of={UnlinkIcon} size={16} />
          </Button>
        ),
    },
  ];
  const shown = view === 'active' ? live : view === 'ended' ? endedShares : (asked.data ?? []);

  return (
    <PanelCard
      title={say('common.sharedLinks')}
      isFlush
      actions={
        <>
          <SegmentedRow
            label={say('common.show')}
            size="sm"
            tone="accent"
            items={[
              {
                id: 'active',
                label: say('screens.adminArea.sharesPanel.activeCount', { count: live.length }),
              },
              {
                id: 'ended',
                label: say('screens.adminArea.sharesPanel.endedCount', {
                  count: endedShares.length,
                }),
              },
              { id: 'all', label: say('common.all') },
            ]}
            value={view}
            onSelect={setView}
          />
          <PanelCardInfo
            label={say('screens.adminArea.sharesPanel.aboutSharedLinks')}
            detail={say('screens.adminArea.sharesPanel.anybodyHoldingOneOfTheseCan')}
          />
        </>
      }
    >
      <ConfirmDialog
        title={say('common.withdrawThisLink')}
        detail={
          withdrawing === null
            ? ''
            : say('screens.adminArea.sharesPanel.createdByNameSLinkToTitleStops', {
                createdByName: nameOfAsker({
                  profileName: withdrawing.createdByProfileName,
                  household: withdrawing.createdByName,
                }),
                title: withdrawing.title,
              })
        }
        confirmLabel={say('common.withdrawIt')}
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
                say('screens.adminArea.sharesPanel.withdrewTheLink'),
                failureOfAnswer(revoked, say('common.thatLinkCouldNotBeWithdrawn')),
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
          said={say('screens.adminArea.sharesPanel.theLinksCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          label={say('screens.adminArea.sharesPanel.readingTheLinks')}
          size="sm"
        />
      ) : (
        <DataTable
          label={say('common.sharedLinks')}
          columns={columns}
          rows={shown}
          getRowId={(share) => share.id}
          pageSize={15}
          emptyMessage={
            view === 'active' && endedShares.length > 0
              ? say('screens.adminArea.sharesPanel.noActiveLinks')
              : say('screens.adminArea.sharesPanel.nobodyHasHandedOutALink')
          }
        />
      )}
    </PanelCard>
  );
};

SharesPanel.displayName = 'SharesPanel';

export { SharesPanel };
