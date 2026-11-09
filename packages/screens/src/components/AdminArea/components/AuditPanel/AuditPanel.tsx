import { useEffect, useMemo, useState } from 'react';
import {
  Archive as ArchiveIcon,
  ClipboardList as ClipboardListIcon,
  Film as FilmIcon,
  FolderOpen as FolderOpenIcon,
  Folders as FoldersIcon,
  Key as KeyIcon,
  KeyRound as KeyRoundIcon,
  Link as LinkIcon,
  Play as PlayIcon,
  Puzzle as PuzzleIcon,
  Settings as SettingsIcon,
  ShieldUser as ShieldUserIcon,
  Terminal as TerminalIcon,
  User as UserIcon,
  Users as UsersIcon,
  Webhook as WebhookIcon,
} from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { AccountFace } from '@ValenceScreens/components/AdminArea/components/AccountFace/AccountFace';
import { DeviceLabel } from '@ValenceScreens/components/DeviceLabel/DeviceLabel';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { nameTheClient } from '@ValenceCore/functions/nameTheClient';
import { nameTheDevice } from '@ValenceCore/functions/nameTheDevice';
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

const PAGE_SIZE = 25;

const EVERY_TIME: LogRangeId = 'all';

const CATEGORY = 'category:';

const PERSON = 'person:';

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
const whereFrom = (entry: AuditEntry): { device: string | null; address: string | null } => {
  if (entry.userAgent === null) {
    return { device: null, address: entry.address };
  }

  const address =
    entry.address === '::1' || entry.address === '127.0.0.1' || entry.address === '::ffff:127.0.0.1'
      ? say('screens.adminArea.auditPanel.addressSameMachine', { address: entry.address })
      : entry.address;
  const identity = identifyDevice({ userAgent: entry.userAgent });

  if (
    identity.name === null &&
    identity.model === null &&
    identity.system === null &&
    identity.form !== 'tv'
  ) {
    return { device: null, address };
  }

  return {
    device: say('common.deviceThroughClient', {
      device: sayAgain(nameTheDevice(identity)),
      client: sayAgain(nameTheClient(identity)),
    }),
    address,
  };
};

const CATEGORY_ICONS: Readonly<Record<AuditCategory, typeof SettingsIcon>> = {
  auth: KeyRoundIcon,
  account: UsersIcon,
  profile: UserIcon,
  role: ShieldUserIcon,
  library: FoldersIcon,
  media: FilmIcon,
  files: FolderOpenIcon,
  request: ClipboardListIcon,
  share: LinkIcon,
  stream: PlayIcon,
  job: TerminalIcon,
  settings: SettingsIcon,
  plugin: PuzzleIcon,
  webhook: WebhookIcon,
  backup: ArchiveIcon,
};

/**
 * The icon of the kind of change an action is, read from the start of its name.
 *
 * @param action - The action, such as `library.created`.
 * @returns Its kind's icon, or the settings icon where the kind is not known.
 */
const iconOfAction = (action: string) => {
  const category = AUDIT_CATEGORIES.find((one) => action.startsWith(`${one}.`));

  return category === undefined ? SettingsIcon : CATEGORY_ICONS[category];
};

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
  const narrowing = `${order}:${range}:${search}:${category ?? ''}:${actorId ?? ''}`;
  const [paging, setPaging] = useState({ narrowing, page: 0 });
  const tablePage = paging.narrowing === narrowing ? paging.page : 0;
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
        name: say('screens.adminArea.addLibraryDialog.type'),
        isSingle: true,
        options: AUDIT_CATEGORIES.map((id) => ({
          id: `${CATEGORY}${id}`,
          label: AUDIT_CATEGORY_NAMES[id],
        })),
      },
      {
        name: say('common.person'),
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
            <span className="whitespace-nowrap tabular-nums text-text-muted">
              {describeSince(row.original.at, now)}
            </span>
          </Tooltip>
        ),
      },
      {
        id: 'actor',
        enableSorting: false,
        header: say('common.person'),
        accessorFn: whoDid,
        cell: ({ row }) => {
          const account = (people.data ?? []).find((one) => one.id === row.original.actorId);

          return (
            <span className="flex min-w-0 items-center gap-2">
              {account !== undefined ? (
                <span className="flex shrink-0 [&>*]:!size-6">
                  <AccountFace account={account} />
                </span>
              ) : row.original.actorName === '' ? (
                <span aria-hidden className="size-6 shrink-0" />
              ) : (
                <span
                  aria-hidden
                  title={say('screens.adminArea.auditPanel.thisAccountNoLongerExists')}
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[0.6875rem] font-semibold text-text-muted"
                >
                  {row.original.actorName.charAt(0).toUpperCase()}
                </span>
              )}
              <span
                className={
                  row.original.actorName === '' ? 'truncate text-text-muted' : 'truncate text-text'
                }
              >
                {whoDid(row.original)}
              </span>
            </span>
          );
        },
      },
      {
        id: 'action',
        enableSorting: false,
        header: say('screens.adminArea.auditPanel.action'),
        accessorFn: (entry) => AUDIT_ACTION_NAMES[entry.action],
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2 whitespace-nowrap text-text">
              <Icon
                of={iconOfAction(row.original.action)}
                size={14}
                tone="muted"
                className="shrink-0"
              />
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
        header: say('screens.adminArea.auditPanel.item'),
        accessorFn: (entry) => entry.target ?? '',
        cell: ({ row }) => {
          const detail = describeAuditDetail(row.original, jobLabels);

          return (row.original.target === null || row.original.target === row.original.actorName) &&
            detail.length > 0 ? (
            <span className="block max-w-[min(36rem,50vw)] truncate text-text">
              {detail.join(' · ')}
            </span>
          ) : (
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
        header: say('common.device'),
        accessorFn: (entry) => entry.address ?? '',
        cell: ({ row }) => {
          const { device, address } = whereFrom(row.original);
          const viaKey = row.original.detail?.['apiKey'];

          const tool =
            device === null && row.original.userAgent !== null && row.original.userAgent !== ''
              ? (row.original.userAgent.split(' ')[0]?.replace('/', ' ') ?? null)
              : null;

          if (viaKey === undefined && tool !== null) {
            return (
              <span className="flex max-w-[16rem] min-w-0 flex-col gap-0.5">
                <span
                  className="flex min-w-0 items-center gap-1.5 text-text"
                  title={row.original.userAgent ?? undefined}
                >
                  <Icon of={TerminalIcon} size={14} tone="muted" className="shrink-0" />
                  <span className="truncate">{tool}</span>
                </span>
                {address === null ? null : (
                  <span className="truncate text-xs tabular-nums text-text-muted">{address}</span>
                )}
              </span>
            );
          }

          if (viaKey !== undefined) {
            return (
              <span className="flex max-w-[16rem] min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 items-center gap-1.5 text-text">
                  <Icon of={KeyIcon} size={14} tone="muted" className="shrink-0" />
                  <span className="truncate">
                    {say('screens.adminArea.auditPanel.apiKeyName', { name: viaKey })}
                  </span>
                </span>
                {address === null ? null : (
                  <span className="truncate text-xs tabular-nums text-text-muted">{address}</span>
                )}
              </span>
            );
          }

          return device === null && address === null ? (
            <span className="text-text-muted">—</span>
          ) : (
            <span className="flex max-w-[16rem] min-w-0 flex-col gap-0.5">
              {device === null || row.original.userAgent === null ? null : (
                <span className="truncate text-text">
                  <DeviceLabel
                    device={sayAgain(
                      nameTheDevice(identifyDevice({ userAgent: row.original.userAgent })),
                    )}
                    client={sayAgain(
                      nameTheClient(identifyDevice({ userAgent: row.original.userAgent })),
                    )}
                    identity={identifyDevice({ userAgent: row.original.userAgent })}
                    userAgent={row.original.userAgent}
                  />
                </span>
              )}
              {address === null ? null : (
                <span className="truncate text-xs tabular-nums text-text-muted">{address}</span>
              )}
            </span>
          );
        },
      },
    ],
    [now, jobLabels, people.data],
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
              options: LOG_RANGES.map((one) => ({
                id: one.id,
                label:
                  one.id === EVERY_TIME
                    ? say('screens.adminArea.preTranscodingCard.anyTime')
                    : one.label,
              })),
              value: range,
              onChange: (id) => {
                setRange(LOG_RANGES.find((one) => one.id === id)?.id ?? EVERY_TIME);
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
        <DataTable
          height="fills"
          label={say('screens.adminArea.adminSections.auditLog')}
          columns={columns}
          rows={entries}
          pageSize={PAGE_SIZE}
          hasMoreRows={asked.hasNextPage}
          page={tablePage}
          onPageChange={(next) => {
            setPaging({ narrowing, page: next });

            if ((next + 1) * PAGE_SIZE > entries.length && asked.hasNextPage) {
              void asked.fetchNextPage();
            }
          }}
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
      )}
    </PanelCard>
  );
};

AuditPanel.displayName = 'AuditPanel';

export { AuditPanel };
