import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { SelectField } from '@ValenceUI/SelectField';
import { Spinner } from '@ValenceUI/Spinner';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { DeviceLabel } from '@ValenceScreens/components/DeviceLabel/DeviceLabel';
import { hoursInWords } from '@ValenceScreens/admin/hoursInWords';
import { say } from '@ValenceI18n/say';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { RecentViewing } from '@ValenceContracts/schemas/RecentViewing';

const EVERYONE = 'everyone';

const dayOf = (at: string): string => {
  const then = new Date(at);
  const today = new Date();
  const days = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(then.toDateString()).getTime()) /
      86_400_000,
  );

  if (days === 0) {
    return say('common.today');
  }

  if (days === 1) {
    return say('client.history.describeWhen.yesterday');
  }

  if (days < 7) {
    return then.toLocaleDateString(undefined, { weekday: 'long' });
  }

  return then.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(then.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  });
};

const kindOfLabel = (label: string): ClientKind | undefined =>
  /\b(TV|Fire TV|Apple TV|Android TV|Shield)\b/i.test(label)
    ? 'tv'
    : /\b(iPhone|iPad|Android|Pixel|Galaxy)\b/i.test(label)
      ? 'phone'
      : undefined;

/**
 * What was watched lately on the server, newest first and grouped by day: the poster, what it was,
 * who watched it, on what, for how long and whether they finished.
 */
const WatchHistoryCard = () => {
  const asked = useQuery(adminQueries.watchHistory());
  const known = useQuery(adminQueries.accounts());
  const accounts = new Map((known.data ?? []).map((account) => [account.id, account]));
  const [viewer, setViewer] = useState(EVERYONE);
  const viewings = asked.data ?? [];
  const viewers = [
    ...new Map(
      viewings.map((viewing) => [
        viewing.profileId,
        viewing.profileName ?? say('screens.admin.nameOfSession.unknownViewer'),
      ]),
    ),
  ];
  const picked =
    viewer === EVERYONE ? viewings : viewings.filter((viewing) => viewing.profileId === viewer);
  const whenOf = (at: string) =>
    `${dayOf(at)}, ${new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

  const columns: DataTableColumn<RecentViewing>[] = [
    {
      id: 'title',
      header: say('common.title'),
      accessorFn: (viewing) => viewing.seriesTitle ?? viewing.title ?? '',
      cell: ({ row }) => {
        const viewing = row.original;

        return (
          <span className="flex min-w-0 items-center gap-3">
            <img
              src={artworkUrl(viewing.mediaItemId, 'poster', { isOfTitle: true, size: 'small' })}
              alt=""
              loading="lazy"
              className="aspect-[2/3] w-7 shrink-0 rounded bg-[var(--surface-hover)] object-cover"
            />
            <span className="flex min-w-0 max-w-[24rem] flex-col">
              <span className="truncate font-medium text-text">
                {viewing.seriesTitle ?? viewing.title ?? '—'}
              </span>
              {viewing.seriesTitle === null || viewing.title === null ? null : (
                <span className="truncate text-xs text-text-muted">{viewing.title}</span>
              )}
            </span>
          </span>
        );
      },
    },
    {
      id: 'person',
      header: say('common.person'),
      accessorFn: (viewing) => viewing.profileName ?? '',
      cell: ({ row }) => {
        const account = accounts.get(row.original.accountId ?? '');

        return (
          <span className="flex min-w-0 items-center gap-2">
            {account === undefined ? null : (
              <span className="flex shrink-0 [&>*]:!size-6">
                <AccountFace account={account} />
              </span>
            )}
            <span className="truncate text-text">
              {row.original.profileName ?? say('screens.admin.nameOfSession.unknownViewer')}
            </span>
          </span>
        );
      },
    },
    {
      id: 'device',
      meta: { hidesOnPhones: true },
      header: say('common.device'),
      accessorFn: (viewing) => viewing.deviceLabel ?? '',
      cell: ({ row }) => {
        const label = row.original.deviceLabel;
        const kind = label === null ? undefined : kindOfLabel(label);

        return label === null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="block max-w-[16rem] truncate text-text-muted">
            <DeviceLabel
              device={label.replace(/^Valence on /, '')}
              {...(kind === undefined ? {} : { clientKind: kind })}
            />
          </span>
        );
      },
    },
    {
      id: 'watched',
      header: say('screens.adminArea.watchHistoryCard.watchedFor'),
      accessorFn: (viewing) => viewing.secondsWatched,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-text-muted">
          {row.original.secondsWatched < 60
            ? say('screens.adminArea.watchHistoryCard.underAMinute')
            : hoursInWords(row.original.secondsWatched / 3600)}
          {row.original.isFinished ? ` · ${say('common.finished')}` : ''}
        </span>
      ),
    },
    {
      id: 'when',
      header: say('screens.observabilityPage.jobHistory.when'),
      accessorFn: (viewing) => viewing.lastWatchedAt,
      cell: ({ row }) => (
        <span
          className="whitespace-nowrap tabular-nums text-text-muted"
          title={new Date(row.original.lastWatchedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        >
          {whenOf(row.original.lastWatchedAt)}
        </span>
      ),
    },
  ];

  return (
    <PanelCard
      title={say('common.watchHistory')}
      isFlush
      actions={
        viewers.length < 2 ? undefined : (
          <SelectField
            label={say('common.person')}
            isLabelHidden
            size="sm"
            className="w-40"
            options={[
              { id: EVERYONE, label: say('common.everyone') },
              ...viewers.map(([id, name]) => ({ id, label: name })),
            ]}
            value={viewer}
            onSelect={(id) => {
              setViewer(id);
            }}
          />
        )
      }
    >
      {asked.isLoadingError ? (
        <CouldNotRead
          said={say('common.whatItHasDoneCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner isCentered size="sm" label={say('common.loading')} />
      ) : (
        <DataTable
          label={say('common.watchHistory')}
          columns={
            viewers.length < 2 && viewer === EVERYONE
              ? columns.filter((column) => column.id !== 'person')
              : columns
          }
          rows={picked}
          getRowId={(viewing) => viewing.id}
          height="fill"
          pageSize={10}
          emptyMessage={say('screens.adminArea.watchHistoryCard.nothingWatchedYet')}
        />
      )}
    </PanelCard>
  );
};

WatchHistoryCard.displayName = 'WatchHistoryCard';

export { WatchHistoryCard };
