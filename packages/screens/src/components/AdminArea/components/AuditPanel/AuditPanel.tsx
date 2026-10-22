import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { FilterSplit } from '@ValenceUI/FilterSplit';
import { PanelCard } from '@ValenceUI/PanelCard';
import { ScopedField } from '@ValenceUI/ScopedField';
import { Spinner } from '@ValenceUI/Spinner';
import { Tooltip } from '@ValenceUI/Tooltip';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { FilterGroup } from '@ValenceUI/FilterMenu.types';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { LOG_RANGES, logRangeStart } from '@ValenceClient/admin/logRanges';
import type { LogRangeId } from '@ValenceClient/admin/logRanges';
import { AUDIT_CATEGORIES } from '@ValenceContracts/schemas/Audit';
import type { AuditCategory, AuditEntry, AuditOrder } from '@ValenceContracts/schemas/Audit';
import { describeDevice } from '@ValenceCore/functions/describeDevice';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { AUDIT_ACTION_NAMES } from '@ValenceScreens/admin/AUDIT_ACTION_NAMES';
import { AUDIT_CATEGORY_NAMES } from '@ValenceScreens/admin/AUDIT_CATEGORY_NAMES';
import { describeAuditDetail } from '@ValenceScreens/admin/describeAuditDetail';
import { useAnchoredNow } from '@ValenceScreens/admin/useAnchoredNow';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';

const TYPING_MS = 350;

const EVERY_TIME: LogRangeId = 'all';

const CATEGORY = 'category:';

const PERSON = 'person:';

const ORDERS: readonly { id: AuditOrder; label: string }[] = [
  { id: 'newest', label: say('common.newestFirst') },
  { id: 'oldest', label: say('common.oldestFirst') },
];

/**
 * Names who did something, for a row of the log: the account by the name it had, nobody at all for
 * a sign-in that failed, and somebody since removed where the account has gone.
 *
 * @param entry - The entry.
 * @returns Who to show.
 */
const whoDid = (entry: AuditEntry): string => {
  if (entry.actorName !== '') {
    return entry.actorName;
  }

  return entry.actorId === null && entry.action.startsWith('auth.')
    ? say('screens.adminArea.auditPanel.nobodySignedIn')
    : say('screens.adminArea.auditPanel.somebodySinceRemoved');
};

/**
 * Says where a change was made from: the device, named as the sessions list names one, and the
 * address it came from.
 *
 * @param entry - The entry.
 * @returns What to show, or nothing where neither was kept.
 */
const whereFrom = (entry: AuditEntry): { device: string | null; address: string | null } => ({
  device: entry.userAgent === null ? null : sayAgain(describeDevice(entry.userAgent)),
  address: entry.address,
});

/**
 * Every sign-in and every change made on this server, newest first unless asked otherwise: who did
 * it, what they did and to what, when, and the device and address it came from. It can be searched
 * by person, title or address, narrowed to a kind of change, one person or a stretch of time, and
 * read further back a page at a time.
 */
const AuditPanel = () => {
  const [typed, setTyped] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AuditCategory | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);
  const [range, setRange] = useState<LogRangeId>(EVERY_TIME);
  const [order, setOrder] = useState<AuditOrder>('newest');
  const [anchor] = useAnchoredNow(`${range}:${search}:${category ?? ''}:${actorId ?? ''}`);
  const now = useTicking(A_CAPTION_AGES_EVERY);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typed.trim());
    }, TYPING_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [typed]);

  const since = logRangeStart(range, anchor);
  const asked = useInfiniteQuery({
    ...adminQueries.auditPages({
      order,
      ...(category === null ? {} : { category }),
      ...(actorId === null ? {} : { actorId }),
      ...(search === '' ? {} : { search }),
      ...(since === null ? {} : { sinceMs: since }),
    }),
    placeholderData: keepPreviousData,
  });
  const people = useQuery(adminQueries.accounts());
  const jobs = useQuery(adminQueries.jobs());
  const jobLabels = useMemo(
    () => new Map((jobs.data ?? []).map((job) => [job.kind, sayAgain(job.label)])),
    [jobs.data],
  );
  const entries = asked.data?.pages.flatMap((page) => page.entries) ?? [];
  const isNarrowed = search !== '' || category !== null || actorId !== null || range !== EVERY_TIME;

  const groups = useMemo<FilterGroup[]>(
    () => [
      {
        name: say('screens.adminArea.auditPanel.kindOfChange'),
        isSingle: true,
        options: AUDIT_CATEGORIES.map((id) => ({
          id: `${CATEGORY}${id}`,
          label: AUDIT_CATEGORY_NAMES[id],
        })),
      },
      {
        name: say('screens.webhookFields.webhookPanes.who'),
        isSingle: true,
        options: (people.data ?? []).map((person) => ({
          id: `${PERSON}${person.id}`,
          label: person.name,
        })),
      },
    ],
    [people.data],
  );
  const chosen = useMemo<ReadonlySet<string>>(
    () =>
      new Set([
        ...(category === null ? [] : [`${CATEGORY}${category}`]),
        ...(actorId === null ? [] : [`${PERSON}${actorId}`]),
      ]),
    [category, actorId],
  );

  const columns = useMemo<DataTableColumn<AuditEntry>[]>(
    () => [
      {
        id: 'at',
        header: say('screens.observabilityPage.jobHistory.when'),
        accessorFn: (entry) => entry.at,
        cell: ({ row }) => (
          <Tooltip label={new Date(row.original.at).toLocaleString()}>
            <span className="whitespace-nowrap text-xs tabular-nums text-text-muted">
              {describeSince(row.original.at, now)}
            </span>
          </Tooltip>
        ),
      },
      {
        id: 'actor',
        enableSorting: false,
        header: say('screens.webhookFields.webhookPanes.who'),
        accessorFn: whoDid,
        cell: ({ row }) => (
          <span
            className={
              row.original.actorName === ''
                ? 'truncate text-text-muted'
                : 'truncate font-medium text-text'
            }
          >
            {whoDid(row.original)}
          </span>
        ),
      },
      {
        id: 'action',
        enableSorting: false,
        header: say('screens.adminArea.overviewPanel.whatIsOn'),
        accessorFn: (entry) => AUDIT_ACTION_NAMES[entry.action],
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="whitespace-nowrap text-text">
              {AUDIT_ACTION_NAMES[row.original.action]}
            </span>

            {row.original.target === null ? null : (
              <span className="max-w-[40vw] truncate text-xs text-text-muted sm:hidden">
                {row.original.target}
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'target',
        enableSorting: false,
        meta: { hidesOnPhones: true },
        header: say('screens.adminArea.auditPanel.onWhat'),
        accessorFn: (entry) => entry.target ?? '',
        cell: ({ row }) => {
          const detail = describeAuditDetail(row.original, jobLabels);

          return (
            <span className="flex max-w-[min(36rem,50vw)] min-w-0 flex-col gap-0.5">
              <Tooltip label={row.original.target ?? '—'}>
                <span className="truncate text-text">{row.original.target ?? '—'}</span>
              </Tooltip>

              {detail.length === 0 ? null : (
                <Tooltip label={detail.join(' · ')}>
                  <span className="truncate text-xs text-text-muted">{detail.join(' · ')}</span>
                </Tooltip>
              )}
            </span>
          );
        },
      },
      {
        id: 'where',
        enableSorting: false,
        meta: { hidesOnPhones: true },
        header: say('common.where'),
        accessorFn: (entry) => entry.address ?? '',
        cell: ({ row }) => {
          const { device, address } = whereFrom(row.original);

          return device === null && address === null ? (
            <span className="text-text-muted">—</span>
          ) : (
            <span className="flex max-w-[16rem] min-w-0 flex-col gap-0.5">
              {device === null ? null : <span className="truncate text-text">{device}</span>}
              {address === null ? null : (
                <span className="truncate text-xs tabular-nums text-text-muted">{address}</span>
              )}
            </span>
          );
        },
      },
    ],
    [now, jobLabels],
  );

  return (
    <PanelCard
      title={say('screens.adminArea.adminSections.auditLog')}
      isFlush
      actions={
        <PanelCardInfo
          label={say('screens.adminArea.auditPanel.aboutTheAuditLog')}
          detail={say('screens.adminArea.auditPanel.everySignInAndChange')}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 p-3">
        <ScopedField
          label={say('screens.adminArea.auditPanel.searchTheAuditLog')}
          isLabelHidden
          placeholder={say('screens.adminArea.auditPanel.searchByWhoWhatOrAddress')}
          value={typed}
          onValueChange={setTyped}
          choices={[
            {
              label: say('screens.observabilityPage.timeRangeMenu.timeRange'),
              options: LOG_RANGES.map((one) => ({ id: one.id, label: one.label })),
              value: range,
              onChange: (id) => {
                setRange(LOG_RANGES.find((one) => one.id === id)?.id ?? EVERY_TIME);
              },
            },
            {
              label: say('common.order'),
              options: ORDERS.map((one) => ({ id: one.id, label: one.label })),
              value: order,
              onChange: (id) => {
                setOrder(id === 'oldest' ? 'oldest' : 'newest');
              },
            },
          ]}
          className="min-w-56 flex-1"
        />

        <FilterSplit
          label={say('screens.adminArea.auditPanel.filterTheAuditLog')}
          groups={groups}
          selected={chosen}
          onChange={(next) => {
            const picked = [...next];

            setCategory(
              AUDIT_CATEGORIES.find((one) => picked.includes(`${CATEGORY}${one}`)) ?? null,
            );
            setActorId(picked.find((one) => one.startsWith(PERSON))?.slice(PERSON.length) ?? null);
          }}
        />
      </div>

      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.auditPanel.theAuditLogCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.auditPanel.readingTheAuditLog')}
        />
      ) : (
        <>
          <DataTable
            height="fills"
            label={say('screens.adminArea.adminSections.auditLog')}
            columns={columns}
            rows={entries}
            getRowId={(entry) => entry.id}
            sorting={{ id: 'at', isDescending: order === 'newest' }}
            onSortingChange={(next) => {
              setOrder(next !== null && !next.isDescending ? 'oldest' : 'newest');
            }}
            emptyMessage={
              isNarrowed
                ? say('screens.adminArea.auditPanel.nothingMatchesThat')
                : say('screens.adminArea.auditPanel.nothingHasBeenChangedYet')
            }
          />

          {asked.hasNextPage ? (
            <div className="flex justify-center p-3">
              <Button
                variant="secondary"
                size="sm"
                isLoading={asked.isFetchingNextPage}
                onClick={() => {
                  void asked.fetchNextPage();
                }}
              >
                {say('screens.adminArea.auditPanel.readFurtherBack')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </PanelCard>
  );
};

AuditPanel.displayName = 'AuditPanel';

export { AuditPanel };
