import { useMemo, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft as ChevronLeftIcon,
  MoveLeft as MoveLeftIcon,
  MoveRight as MoveRightIcon,
} from '@keyline-icons/react';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { describeReencodeState } from '@ValenceClient/admin/describeReencodeState';
import { describeRange } from '@ValenceClient/library/describeRange';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { TitleDetails } from './components/TitleDetails/TitleDetails';
import { TitleHistory } from './components/TitleHistory/TitleHistory';
import { TitlePartDialog } from './components/TitlePartDialog/TitlePartDialog';
import { RefreshTitleDialog } from './components/RefreshTitleDialog/RefreshTitleDialog';
import { useTitleChange } from './components/TitleDetails/useTitleChange';
import { unmatchTitle } from '@ValenceClient/admin/unmatchTitle';
import { notify } from '@ValenceUI/notify';
import { watchJob } from '@ValenceScreens/components/AdminArea/scanCoordinator';
import { SeasonList } from '@ValenceScreens/components/AdminArea/components/SeasonList/SeasonList';
import { seasonsOfShow } from '@ValenceScreens/components/AdminArea/components/MediaPanel/seasonsOfShow';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { FIELDS_OF_KIND } from '@ValenceContracts/schemas/TitleEdit';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import { describeAudio } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeAudio';
import { describeNumber } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeNumber';
import { describeTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeTitle';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';
import type { MediaTitlePageProps } from './MediaTitlePage.types';
import type { ReactNode } from 'react';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';
import { FolderView } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/FolderView/FolderView';
import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import { TITLE_TABS } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TITLE_TABS';
import { useShortcut } from '@ValenceUI/useShortcut';
import type { OpenPart } from './components/TitlePartDialog/TitlePartDialog.types';
import type { TitleEpisode, TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';

const NOWHERE: TitlePlace = { tab: 'details', season: null, episode: null };

const NO_LIBRARIES: readonly Library[] = [];

const ALREADY_A_FILE_ACTION: readonly string[] = ['leave-out', 'show-in-files', 'delete'];

/**
 * Every file a title is made of, down to the versions of each.
 *
 * @param title - The title.
 * @returns Its files, each as a row of its own.
 */
const leavesOf = (title: MediaTitle): MediaTitle[] =>
  title.parts.length === 0 ? [title] : title.parts.flatMap(leavesOf);

/**
 * Says how a title is matched in the catalogue: matched, matched to a TMDB number, or matched to
 * another catalogue's id.
 *
 * @param title - The title.
 * @returns What to say, or nothing when it is not matched.
 */
const describeMatch = (title: MediaTitle): string | null => {
  const id = title.lead.externalId;

  if (!title.isMatched) {
    return null;
  }

  if (id === null || id === undefined) {
    return say('screens.importWizard.importReportView.matched');
  }

  return /^\d+$/u.test(id)
    ? say('screens.adminArea.mediaTitlePage.matchedTmdbId', { id })
    : say('screens.adminArea.mediaTitlePage.matchedId', { id });
};

/**
 * One title opened from Media: its backdrop, poster, overview and match, what can be done to it,
 * its files with their quality and sound, and any re-encodes asked of them.
 *
 * @param title - The title.
 * @param library - The library it is in.
 * @param actionsFor - What can be done to the title and to each of its files.
 * @param place - Where it is on the disk, where known.
 * @param paths - Where each file is, by its item.
 * @param onOpenFolder - Called with a folder to open in Files, where the file manager is offered.
 * @param onOpenInCatalogue - Called with where the title is in the Catalogue, where it can be opened.
 * @param onBack - Called to go back to every title.
 * @param onPrevious - Opens the title before this one in the list, where there is one.
 * @param onNext - Opens the title after this one in the list, where there is one.
 * @param titlePlace - Which tab, season and episode to show, where the address keeps them.
 * @param onTitlePlace - Told where the page has moved to, where the address keeps it.
 * @param libraries - Every library, for the file manager on the Files tab.
 * @param mayManageFiles - Whether whoever is looking may delete and move the title's files.
 * @param onFilesChanged - Told that something on the disk changed on the Files tab.
 * @param onScan - Asked to scan a library once something is uploaded into the title's folder.
 */
const MediaTitlePage = ({
  title,
  library,
  actionsFor,
  place,
  paths,
  onOpenFolder,
  onOpenInCatalogue,
  onBack,
  onPrevious,
  onNext,
  titlePlace,
  onTitlePlace,
  libraries = NO_LIBRARIES,
  mayManageFiles = false,
  onFilesChanged,
  onScan,
}: MediaTitlePageProps) => {
  const [localPlace, setLocalPlace] = useState<TitlePlace>(NOWHERE);
  const at = titlePlace ?? localPlace;
  const moveTo = onTitlePlace ?? setLocalPlace;
  const [editingSeason, setEditingSeason] = useState<OpenPart | null>(null);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [lastEpisode, setLastEpisode] = useState<OpenPart | null>(null);
  const [isRefreshOpen, setIsRefreshOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const metadata = useQuery(adminQueries.titleMetadata(title.lead.id, 'title'));
  const { change } = useTitleChange(title.lead.id, 'title');
  const tabs = TITLE_TABS.filter((one) => one !== 'seasons' || title.kind === 'series');
  const tab = tabs.includes(at.tab) ? at.tab : 'details';
  const travel = useTravelDirection([...tabs], tab);

  useShortcut('K', onPrevious);
  useShortcut('J', onNext);
  const prefersReducedMotion = useReducedMotionConfig();
  const detail = useQuery({
    ...libraryQueries.detail(title.kind === 'film' ? title.lead.id : null),
    enabled: title.kind === 'film',
  });
  const show = useQuery({
    ...libraryQueries.show(
      title.libraryId,
      title.kind === 'series' ? (title.lead.seriesId ?? null) : null,
    ),
    enabled: title.kind === 'series' && title.lead.seriesId !== null,
  });
  const reencodes = useQuery(adminQueries.reencodes());
  const requesting = useQuery(requestsQueries.availability());
  const catalogue = useQuery({
    ...requestsQueries.titleCatalogue(),
    enabled: requesting.data?.isEnabled === true,
  });

  const seasons = useMemo(
    () =>
      show.data === undefined || show.data === null
        ? []
        : seasonsOfShow(show.data, paths, localDayOf()),
    [show.data, paths],
  );

  /**
   * Describes an episode for its editor.
   *
   * @param season - The season it is in.
   * @param episode - The episode, which has a file.
   * @param mediaId - Its file.
   * @returns What the editor shows of it.
   */
  const partOf = (season: TitleSeason, episode: TitleEpisode, mediaId: string): OpenPart => {
    const code = say('common.searchWhatEpisode', {
      season: season.season.toString().padStart(2, '0'),
      episode: episode.episode.toString().padStart(2, '0'),
    });

    return {
      scope: 'episode',
      mediaId,
      title: episode.title === '' ? code : episode.title,
      detail: code,
      path: episode.path,
    };
  };

  /**
   * Opens an episode's editor.
   *
   * @param season - The season it is in.
   * @param episode - The episode.
   */
  const openEpisode = (season: TitleSeason, episode: TitleEpisode) => {
    if (episode.mediaId === null || episode.mediaId === undefined) {
      return;
    }

    moveTo({ tab: 'seasons', season: season.season, episode: episode.mediaId });
  };

  const openSeason = seasons.find((one) =>
    one.episodes.some((episode) => at.episode !== null && episode.mediaId === at.episode),
  );
  const editable = (openSeason?.episodes ?? []).filter(
    (episode) => episode.mediaId !== null && episode.mediaId !== undefined,
  );
  const openAt = editable.findIndex((episode) => episode.mediaId === at.episode);
  const openEpisodeOf = openAt < 0 ? undefined : editable[openAt];
  const episodePart =
    openSeason === undefined || openEpisodeOf === undefined || at.episode === null
      ? null
      : partOf(openSeason, openEpisodeOf, at.episode);
  const before = openAt > 0 ? editable[openAt - 1] : undefined;
  const after = openAt >= 0 ? editable[openAt + 1] : undefined;

  const leaves = leavesOf(title);
  const leafIds = new Set(leaves.map((leaf) => leaf.lead.id));
  const overview =
    title.kind === 'series'
      ? (show.data?.overview ?? null)
      : (detail.data?.metadata.overview ?? null);
  const catalogueEntry =
    catalogue.data?.find(
      (entry) =>
        (entry.mediaId !== null && leafIds.has(entry.mediaId)) ||
        (title.lead.externalId !== null &&
          title.lead.externalId !== undefined &&
          entry.catalogueId === title.lead.externalId &&
          (entry.kind === 'film') === (title.kind === 'film')),
    ) ?? null;
  const pastReencodes = (reencodes.data ?? []).filter((one) => leafIds.has(one.mediaId));
  const titleActions = actionsFor(title);
  const everyAction = titleActions.flat();
  const fix = everyAction.find((one) => one.id === 'wrong-match');
  const artwork = everyAction.find((one) => one.id === 'artwork');

  /**
   * Follows a job reading the title again, showing that it is being refreshed until it is done.
   *
   * @param jobId - The job, or nothing where the work is already done.
   */
  const follow = (jobId: string | null) => {
    if (jobId === null) {
      return;
    }

    setIsRefreshing(true);
    void watchJob(title.libraryId, 'library.readAgain', jobId).finally(() => {
      setIsRefreshing(false);
    });
  };

  const unlocked =
    metadata.data === undefined
      ? []
      : FIELDS_OF_KIND[metadata.data.subject.kind].filter((field) => {
          const state = metadata.data.fields[field];

          return (
            field !== 'note' &&
            state !== undefined &&
            state.source !== 'edited' &&
            state.source !== 'locked'
          );
        });
  const moreActions = [
    [
      ...(artwork === undefined ? [] : [artwork]),
      ...(unlocked.length === 0
        ? []
        : [
            {
              id: 'lock',
              label: say('screens.adminArea.mediaTitlePage.keepEverythingAsItIs'),
              onChoose: () => {
                void change(
                  { lock: unlocked },
                  say('screens.adminArea.mediaTitlePage.lockedEveryField'),
                ).then((outcome) => {
                  if (!outcome.isSaved) {
                    notify.failed(outcome.reason);
                  }
                });
              },
            },
          ]),
      ...(title.isMatched
        ? [
            {
              id: 'unmatch',
              label: say('screens.adminArea.mediaTitlePage.unmatch'),
              onChoose: () => {
                void unmatchTitle(title.lead.id).then((answer) => {
                  if (answer.kind === 'refused') {
                    notify.failed(answer.reason);

                    return;
                  }

                  notify.worked(say('screens.adminArea.correctionPicker.itWillSayWhatItsFiles'));
                  follow(answer.jobId);
                });
              },
            },
          ]
        : []),
    ],
    place === null || onOpenFolder === undefined
      ? []
      : [
          {
            id: 'open-folder',
            label: say('screens.adminArea.mediaTitlePage.openFolder'),
            onChoose: () => {
              onOpenFolder(place.folder);
            },
          },
        ],
    ...titleActions.map((group) =>
      group.filter((one) => one.id !== 'wrong-match' && one.id !== 'artwork'),
    ),
  ].filter((group) => group.length > 0);
  const totalBytes = leaves.reduce((sum, leaf) => sum + (leaf.lead.sizeBytes ?? 0), 0);
  const filesWord = title.kind === 'series' ? say('common.episodes') : say('common.files');
  const nameOfLeaf = (leaf: MediaTitle) =>
    leaf.kind === 'episode'
      ? `S${(leaf.lead.seasonNumber ?? 0).toString()} ${describeNumber(leaf.lead)} · ${leaf.name}`
      : leaf.kind === 'version'
        ? leaf.name
        : (paths[leaf.lead.id]?.split('/').pop() ?? leaf.name);

  const leafById = new Map(leaves.map((leaf) => [leaf.lead.id, leaf]));
  const leafNames = new Set(
    leaves.flatMap((leaf) => {
      const file = paths[leaf.lead.id];

      return file === undefined ? [] : [file.split('/').at(-1) ?? file];
    }),
  );
  const isLooseInLibrary = place !== null && place.folder === library?.path;

  /**
   * Whether an entry of the title's folder belongs on its Files tab: none of another title's, and
   * in a library's own folder, only this title's files and what belongs with them.
   *
   * @param entry - The entry.
   * @returns Whether to show it.
   */
  const keepsHere = (entry: LibraryEntry): boolean => {
    const isOurs =
      entry.titleId === title.id ||
      (entry.belongsTo !== null && entry.belongsTo !== undefined && leafNames.has(entry.belongsTo));

    if (isLooseInLibrary) {
      return isOurs;
    }

    return (
      isOurs ||
      ((entry.titleId === null || entry.titleId === undefined) &&
        (entry.belongsTo === null || entry.belongsTo === undefined))
    );
  };

  /**
   * What can be done to the file an entry is, as Media offers it, less what the file manager
   * already does to any file.
   *
   * @param entry - The entry.
   * @returns The groups of actions.
   */
  const mediaActionsOf = (entry: LibraryEntry): ActionMenuItem[][] => {
    const leaf = entry.mediaId === null ? undefined : leafById.get(entry.mediaId);

    return leaf === undefined
      ? []
      : actionsFor(leaf)
          .map((group) => group.filter((one) => !ALREADY_A_FILE_ACTION.includes(one.id)))
          .filter((group) => group.length > 0);
  };

  /**
   * Draws something of the video an entry is, or a dash for anything else.
   *
   * @param entry - The entry.
   * @param draw - What to draw of the video.
   * @returns What to show.
   */
  const ofVideo = (entry: LibraryEntry, draw: (leaf: MediaTitle) => ReactNode): ReactNode => {
    const leaf = entry.mediaId === null ? undefined : leafById.get(entry.mediaId);

    return leaf === undefined ? <span className="text-text-muted">—</span> : draw(leaf);
  };

  const mediaColumns: DataTableColumn<LibraryEntry>[] = [
    {
      id: 'quality',
      header: say('common.quality'),
      enableSorting: false,
      cell: ({ row }) =>
        ofVideo(row.original, (leaf) => {
          const range = describeRange(leaf.lead.videoRange);

          return (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-text">{sharpestStepOf(leaf.lead)?.label ?? '—'}</span>
              {range === null ? null : <Badge size="sm">{range}</Badge>}
            </span>
          );
        }),
    },
    {
      id: 'video',
      header: say('common.video'),
      enableSorting: false,
      cell: ({ row }) =>
        ofVideo(row.original, (leaf) => (
          <span className="text-text-muted">{leaf.lead.videoCodec.toUpperCase()}</span>
        )),
    },
    {
      id: 'audio',
      header: say('common.audio'),
      enableSorting: false,
      cell: ({ row }) =>
        ofVideo(row.original, (leaf) => (
          <span className="whitespace-nowrap text-text-muted">{describeAudio(leaf.lead)}</span>
        )),
    },
    {
      id: 'length',
      header: say('screens.adminArea.titlePage.trackTable.length'),
      enableSorting: false,
      cell: ({ row }) =>
        ofVideo(row.original, (leaf) => (
          <span className="tabular-nums text-text-muted">
            {formatDuration(leaf.lead.durationSeconds)}
          </span>
        )),
    },
  ];

  const fileColumns: DataTableColumn<MediaTitle>[] = [
    {
      id: 'name',
      header:
        title.kind === 'series'
          ? say('common.episode')
          : say('desktop.main.theApplicationMenu.file'),
      accessorFn: (leaf) => leaf.order,
      cell: ({ row }) => <span className="truncate text-text">{nameOfLeaf(row.original)}</span>,
    },
    {
      id: 'quality',
      header: say('common.quality'),
      cell: ({ row }) => {
        const range = describeRange(row.original.lead.videoRange);

        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-text">{sharpestStepOf(row.original.lead)?.label ?? '—'}</span>
            {range === null ? null : <Badge size="sm">{range}</Badge>}
          </span>
        );
      },
    },
    {
      id: 'video',
      header: say('common.video'),
      cell: ({ row }) => (
        <span className="text-text-muted">{row.original.lead.videoCodec.toUpperCase()}</span>
      ),
    },
    {
      id: 'audio',
      header: say('common.audio'),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {describeAudio(row.original.lead)}
        </span>
      ),
    },
    {
      id: 'length',
      header: say('screens.adminArea.titlePage.trackTable.length'),
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">
          {formatDuration(row.original.lead.durationSeconds)}
        </span>
      ),
    },
    {
      id: 'size',
      header: say('common.size'),
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">
          {row.original.lead.sizeBytes === null || row.original.lead.sizeBytes === undefined
            ? '—'
            : formatBytes(row.original.lead.sizeBytes)}
        </span>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) => {
        const groups = actionsFor(row.original);

        return groups.length === 0 ? null : (
          <ActionMenu
            label={say('common.actionsForName', { name: row.original.name })}
            groups={groups.map((items) => ({ items }))}
          />
        );
      },
    },
  ];

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        const chosen = tabs.find((one) => one === next);

        if (chosen !== undefined) {
          moveTo({ tab: chosen, season: null, episode: null });
        }
      }}
    >
      <motion.div
        className="flex flex-col gap-4"
        initial="hidden"
        animate="shown"
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
      >
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Icon of={ChevronLeftIcon} size={15} />
            {say('common.media')}
          </Button>

          {onPrevious === undefined && onNext === undefined ? null : (
            <span className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                isIconOnly
                label={say('common.previous')}
                shortcut={['K']}
                disabled={onPrevious === undefined}
                {...(onPrevious === undefined ? {} : { onClick: onPrevious })}
              >
                <Icon of={MoveLeftIcon} size={15} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                isIconOnly
                label={say('common.next')}
                shortcut={['J']}
                disabled={onNext === undefined}
                {...(onNext === undefined ? {} : { onClick: onNext })}
              >
                <Icon of={MoveRightIcon} size={15} />
              </Button>
            </span>
          )}
        </div>

        <PanelCard
          title={library?.name ?? say('common.media')}
          below={
            <TabRow
              label={say('screens.adminArea.mediaTitlePage.whatToShowOfTheTitle')}
              tone="underlined"
              size="sm"
              value={tab}
              groups={[
                {
                  items: [
                    { id: 'details', label: say('common.details') },
                    ...(title.kind === 'series'
                      ? [{ id: 'seasons', label: say('screens.seasonChooser.seasons') }]
                      : []),
                    { id: 'files', label: filesWord },
                    { id: 'history', label: say('common.history') },
                  ],
                },
              ]}
            />
          }
        >
          <img
            src={artworkUrl(title.lead.id, 'backdrop', { isOfTitle: true, size: 'medium' })}
            alt=""
            className="-mx-1 -mt-1 mb-5 h-44 w-[calc(100%+0.5rem)] rounded-lg object-cover object-[center_30%] opacity-80"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex flex-wrap items-start gap-5">
            <MediaPoster
              className="w-28"
              src={
                title.posterFrom === null
                  ? null
                  : artworkUrl(title.posterFrom, 'poster', { size: 'small' })
              }
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-text">
                  {title.name}
                  {title.year === null ? null : (
                    <span className="ml-2 font-normal text-text-muted">{title.year}</span>
                  )}
                </span>
                <span className="text-sm text-text-muted">
                  {[
                    library?.name,
                    title.kind === 'series' ? describeTitle(title) : null,
                    describeMatch(title),
                  ]
                    .filter((part) => part !== null && part !== undefined)
                    .join(' · ')}
                  {title.isMatched ? null : (
                    <Badge size="sm" tone="warning" className="ml-2">
                      {say('screens.adminArea.mediaPanel.unmatched')}
                    </Badge>
                  )}
                  {isRefreshing ? (
                    <Badge size="sm" tone="busy" className="ml-2">
                      {say('screens.adminArea.mediaTitlePage.refreshing')}
                    </Badge>
                  ) : null}
                </span>
              </div>

              {overview === null || overview === '' ? null : (
                <p className="max-w-3xl font-body text-sm leading-relaxed text-text-muted">
                  {overview}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {fix === undefined ? null : (
                  <Button variant="secondary" size="md" onClick={fix.onChoose}>
                    {say('screens.adminArea.mediaTitlePage.fixMatch')}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setIsRefreshOpen(true);
                  }}
                >
                  {say('screens.adminArea.refreshTitleDialog.refresh')}
                </Button>
                {catalogueEntry === null || onOpenInCatalogue === undefined ? null : (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      onOpenInCatalogue({ tab: catalogueEntry.tab, title: catalogueEntry.key });
                    }}
                  >
                    {say('screens.adminArea.mediaTitlePage.openInCatalogue')}
                  </Button>
                )}
                {moreActions.length === 0 ? null : (
                  <ActionMenu
                    label={say('common.moreForName', { name: title.name })}
                    size="md"
                    groups={moreActions.map((items) => ({ items }))}
                  />
                )}
              </div>

              <dl className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-6 gap-y-3 pt-2 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">{say('common.added')}</dt>
                  <dd className="text-text">
                    {new Date(title.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">{say('common.files')}</dt>
                  <dd className="tabular-nums text-text">{leaves.length.toLocaleString()}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">{say('common.size')}</dt>
                  <dd className="tabular-nums text-text">{formatBytes(totalBytes)}</dd>
                </div>
                {title.lead.genres === null ||
                title.lead.genres === undefined ||
                title.lead.genres.length === 0 ? null : (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-text-muted">{say('common.genres')}</dt>
                    <dd className="text-text">{title.lead.genres.join(', ')}</dd>
                  </div>
                )}
                {title.lead.rating === null || title.lead.rating === undefined ? null : (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-text-muted">{say('common.rating')}</dt>
                    <dd className="tabular-nums text-text">{title.lead.rating.toFixed(1)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </PanelCard>

        <TabPanel value="details" travel={travel}>
          <TitleDetails
            mediaId={title.lead.id}
            scope="title"
            {...(fix === undefined ? {} : { onFixMatch: fix.onChoose })}
            onShowHistory={() => {
              moveTo({ tab: 'history', season: null, episode: null });
            }}
          />
        </TabPanel>

        {title.kind === 'series' ? (
          <TabPanel value="seasons" travel={travel}>
            <SeasonList
              seasons={seasons}
              {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
              actionsOf={(season) => {
                const mediaId = season.episodes.find(
                  (episode) => episode.mediaId !== null && episode.mediaId !== undefined,
                )?.mediaId;

                return mediaId === null || mediaId === undefined
                  ? []
                  : [
                      {
                        id: 'edit',
                        label: say('common.editDetails'),
                        onChoose: () => {
                          setEditingSeason({
                            scope: 'season',
                            mediaId,
                            title: season.name ?? nameSeason(season.season),
                            detail: title.name,
                            path: null,
                          });
                          setIsSeasonOpen(true);
                        },
                      },
                    ];
              }}
              onOpenEpisode={openEpisode}
              openSeason={at.season}
              onOpenSeason={(season) => {
                moveTo({ tab: 'seasons', season, episode: null });
              }}
            />
          </TabPanel>
        ) : null}

        <TabPanel value="files" travel={travel}>
          <div className="flex flex-col gap-4">
            <PanelCard title={filesWord} isFlush>
              {place === null ? (
                <DataTable
                  label={filesWord}
                  columns={fileColumns}
                  rows={leaves}
                  getRowId={(leaf) => leaf.id}
                  pageSize={25}
                />
              ) : (
                <FolderView
                  key={place.folder}
                  libraries={libraries}
                  mayDelete={mayManageFiles}
                  root={place.folder}
                  onChanged={() => {
                    onFilesChanged?.();
                  }}
                  onScan={(scanned) => {
                    onScan?.(scanned);
                  }}
                  hidesTitles
                  keeps={keepsHere}
                  columns={mediaColumns}
                  actionsOf={mediaActionsOf}
                />
              )}
            </PanelCard>

            {pastReencodes.length === 0 ? null : (
              <PanelCard title={say('screens.adminArea.mediaTitlePage.reEncodes')} isFlush>
                <ul className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--color-text)_6%,transparent)] px-5">
                  {pastReencodes.map((one) => (
                    <li
                      key={one.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-text">
                          {one.seriesTitle === null
                            ? one.title
                            : `${one.seriesTitle} · ${one.title}`}
                        </span>
                        <span className="text-xs text-text-muted">
                          {say('screens.adminArea.mediaTitlePage.askedWhen', {
                            when: describeSince(one.askedAt, Date.now()),
                          })}
                        </span>
                      </span>
                      <span className="flex items-center gap-4 text-text-muted">
                        <span className="tabular-nums">
                          {formatBytes(one.originalSizeBytes)} →{' '}
                          {one.producedBytes === null ? '…' : formatBytes(one.producedBytes)}
                        </span>
                        <Badge size="sm">{describeReencodeState(one.state)}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </PanelCard>
            )}
          </div>
        </TabPanel>

        <TabPanel value="history" travel={travel}>
          <TitleHistory
            mediaId={title.lead.id}
            scope="title"
            kind={title.kind === 'series' ? 'show' : 'film'}
          />
        </TabPanel>
      </motion.div>

      <RefreshTitleDialog
        mediaId={title.lead.id}
        name={title.name}
        kind={title.kind === 'series' ? 'show' : 'film'}
        isMatched={title.isMatched}
        isOpen={isRefreshOpen}
        onClose={() => {
          setIsRefreshOpen(false);
        }}
        onStarted={follow}
      />

      <TitlePartDialog
        part={episodePart ?? (isSeasonOpen ? editingSeason : null) ?? lastEpisode ?? editingSeason}
        isOpen={episodePart !== null || isSeasonOpen}
        onClose={() => {
          if (episodePart === null) {
            setIsSeasonOpen(false);

            return;
          }

          setLastEpisode(episodePart);
          setEditingSeason(null);
          moveTo({ ...at, episode: null });
        }}
        onPrevious={
          before === undefined || openSeason === undefined
            ? undefined
            : () => {
                openEpisode(openSeason, before);
              }
        }
        onNext={
          after === undefined || openSeason === undefined
            ? undefined
            : () => {
                openEpisode(openSeason, after);
              }
        }
      />
    </Tabs>
  );
};

MediaTitlePage.displayName = 'MediaTitlePage';

export { MediaTitlePage };
