import { useMemo, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import {
  ChevronLeft as ChevronLeftIcon,
  Star as StarIcon,
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
import { Spinner } from '@ValenceUI/Spinner';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { TitleDetails } from './components/TitleDetails/TitleDetails';
import { TitleHistory } from './components/TitleHistory/TitleHistory';
import { TitlePartPage } from './components/TitlePartPage/TitlePartPage';
import { TitleCollections } from './components/TitleCollections/TitleCollections';
import { EpisodeTable } from '@ValenceScreens/components/AdminArea/components/EpisodeTable/EpisodeTable';
import { folderOf } from '@ValenceCore/functions/folderOf';
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
import { describeAudio } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeAudio';
import { describeNumber } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeNumber';
import { describeTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeTitle';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';
import type { MediaTitlePageProps } from './MediaTitlePage.types';
import type { ReactNode } from 'react';
import { Lock as LockFilledIcon, Unlink as UnlinkFilledIcon } from '@keyline-icons/react/fill';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';
import { MediaTitleHero } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/MediaTitleHero/MediaTitleHero';
import { FolderView } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/FolderView/FolderView';
import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import { ArtworkChooser } from '@ValenceScreens/components/AdminArea/components/ArtworkChooser/ArtworkChooser';
import { TitlePeople } from './components/TitlePeople/TitlePeople';
import { TITLE_TABS } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TITLE_TABS';
import { useShortcut } from '@ValenceUI/useShortcut';
import type { TitleEpisode, TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';

const NOWHERE: TitlePlace = { tab: 'details', season: null, episode: null, isSeasonPage: false };

const NO_LIBRARIES: readonly Library[] = [];

const FILE_ONLY: readonly string[] = [
  'rebuild',
  'find-subtitles',
  'preview-moment',
  'reencode',
  'kept-copies',
];

const ALREADY_A_FILE_ACTION: readonly string[] = ['leave-out', 'show-in-files', 'delete'];

const EPISODE_BUTTONS: readonly string[] = ['find-subtitles', 'reencode'];

/**
 * Every file a title is made of, down to the versions of each.
 *
 * @param title - The title.
 * @returns Its files, each as a row of its own.
 */
const leavesOf = (title: MediaTitle): MediaTitle[] =>
  title.parts.length === 0 ? [title] : title.parts.flatMap(leavesOf);

/**
 * Says what a title is matched to in the catalogue: a TMDB number, another catalogue's id, or only
 * that it is matched.
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

  return /^\d+$/u.test(id) ? [say('screens.adminArea.sourcedField.tmdb'), id].join(' ') : id;
};

/**
 * One title opened from Media: its poster, the facts of it and its match, what can be done to it,
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
  const [isRefreshOpen, setIsRefreshOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cache = useQueryClient();
  const metadata = useQuery(adminQueries.titleMetadata(title.lead.id, 'title'));
  const { change } = useTitleChange(title.lead.id, 'title');
  const tabs = TITLE_TABS.filter(
    (one) =>
      (one !== 'seasons' || title.kind === 'series') && (one !== 'artwork' || title.isMatched),
  );
  const tab = tabs.includes(at.tab) ? at.tab : 'details';
  const travel = useTravelDirection([...tabs], tab);

  const prefersReducedMotion = useReducedMotionConfig();
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
   * Opens an episode's page.
   *
   * @param season - The season it is in.
   * @param episode - The episode.
   */
  const openEpisode = (season: TitleSeason, episode: TitleEpisode) => {
    if (episode.mediaId === null || episode.mediaId === undefined) {
      return;
    }

    moveTo({ ...NOWHERE, season: season.season, episode: episode.mediaId });
  };

  /**
   * The first file of a season, which its details are read and kept through.
   *
   * @param season - The season.
   * @returns The file, or nothing where none of it is here.
   */
  const fileOfSeason = (season: TitleSeason): string | null =>
    season.episodes.find((episode) => episode.mediaId !== null && episode.mediaId !== undefined)
      ?.mediaId ?? null;

  /**
   * Opens a season's page.
   *
   * @param season - The season.
   */
  const openSeasonPage = (season: number) => {
    moveTo({ ...NOWHERE, season, isSeasonPage: true });
  };

  const episodeSeason = seasons.find((one) =>
    one.episodes.some((episode) => at.episode !== null && episode.mediaId === at.episode),
  );
  const editable = (episodeSeason?.episodes ?? []).filter(
    (episode) => episode.mediaId !== null && episode.mediaId !== undefined,
  );
  const openAt = editable.findIndex((episode) => episode.mediaId === at.episode);
  const openEpisodeOf = openAt < 0 ? undefined : editable[openAt];
  const before = openAt > 0 ? editable[openAt - 1] : undefined;
  const after = openAt >= 0 ? editable[openAt + 1] : undefined;
  const pagedSeasons = seasons.filter((one) => fileOfSeason(one) !== null);
  const seasonPageAt =
    openEpisodeOf !== undefined || !at.isSeasonPage
      ? -1
      : pagedSeasons.findIndex((one) => one.season === at.season);
  const seasonPage = seasonPageAt < 0 ? undefined : pagedSeasons[seasonPageAt];
  const isPartPage = openEpisodeOf !== undefined || seasonPage !== undefined;

  useShortcut('K', isPartPage ? undefined : onPrevious);
  useShortcut('J', isPartPage ? undefined : onNext);

  const leaves = leavesOf(title);
  const leafIds = new Set(leaves.map((leaf) => leaf.lead.id));
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
      artworkRevisions.bump([...leafIds]);
      void cache.invalidateQueries({ queryKey: libraryQueries.key });
      void cache.invalidateQueries({ queryKey: adminQueries.key });
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
      ...(unlocked.length === 0
        ? []
        : [
            {
              id: 'lock',
              label: say('screens.adminArea.mediaTitlePage.lockAllFields'),
              icon: <Icon of={LockFilledIcon} size={15} />,
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
              icon: <Icon of={UnlinkFilledIcon} size={15} />,
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
    ...titleActions.map((group) =>
      group.filter(
        (one) =>
          one.id !== 'wrong-match' &&
          one.id !== 'artwork' &&
          one.id !== 'refresh' &&
          !(title.kind === 'film' && FILE_ONLY.includes(one.id)),
      ),
    ),
  ].filter((group) => group.length > 0);
  const best = sharpestStepOf(title.lead)?.label ?? null;
  const match = describeMatch(title);
  const range = describeRange(title.lead.videoRange);
  const totalBytes = leaves.reduce((sum, leaf) => sum + (leaf.lead.sizeBytes ?? 0), 0);
  const filesWord = say('common.files');
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
      meta: { hidesOnPhones: true },
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
      meta: { hidesOnPhones: true },
      enableSorting: false,
      cell: ({ row }) =>
        ofVideo(row.original, (leaf) => (
          <span className="text-text-muted">{leaf.lead.videoCodec.toUpperCase()}</span>
        )),
    },
    {
      id: 'audio',
      header: say('common.audio'),
      meta: { hidesOnPhones: true },
      enableSorting: false,
      cell: ({ row }) =>
        ofVideo(row.original, (leaf) => (
          <span className="whitespace-nowrap text-text-muted">{describeAudio(leaf.lead)}</span>
        )),
    },
    {
      id: 'length',
      header: say('screens.adminArea.titlePage.trackTable.length'),
      meta: { hidesOnPhones: true },
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
      meta: { hidesOnPhones: true },
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
      meta: { hidesOnPhones: true },
      cell: ({ row }) => (
        <span className="text-text-muted">{row.original.lead.videoCodec.toUpperCase()}</span>
      ),
    },
    {
      id: 'audio',
      header: say('common.audio'),
      meta: { hidesOnPhones: true },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {describeAudio(row.original.lead)}
        </span>
      ),
    },
    {
      id: 'length',
      header: say('screens.adminArea.titlePage.trackTable.length'),
      meta: { hidesOnPhones: true },
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

  if ((at.episode !== null || at.isSeasonPage) && title.kind === 'series' && show.isPending) {
    return <Spinner isCentered size="sm" label={say('common.loading')} />;
  }

  const mediaCrumb = { id: 'media', label: say('common.media') };
  const showCrumb = { id: 'show', label: title.name };

  /**
   * Follows a step of a season's or an episode's trail back up.
   *
   * @param id - The step pressed.
   * @param season - The season the page is in.
   */
  const followTrail = (id: string, season: number) => {
    if (id === 'media') {
      onBack();
    } else if (id === 'show') {
      moveTo({ ...NOWHERE, tab: 'seasons', season });
    } else if (id === 'season') {
      openSeasonPage(season);
    }
  };

  const day = (date: string | null) =>
    date === null
      ? null
      : new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' });

  if (episodeSeason !== undefined && openEpisodeOf !== undefined && at.episode !== null) {
    const episodeId = at.episode;
    const leaf = leafById.get(episodeId);
    const seasonName = episodeSeason.name ?? nameSeason(episodeSeason.season);
    const code = say('common.searchWhatEpisode', {
      season: episodeSeason.season.toString().padStart(2, '0'),
      episode: openEpisodeOf.episode.toString().padStart(2, '0'),
    });
    const name = openEpisodeOf.title === '' ? code : openEpisodeOf.title;
    const file = openEpisodeOf.path;
    const fileName = file === null ? null : (file.split(/[\\/]/u).at(-1) ?? file);
    const quality = leaf === undefined ? null : (sharpestStepOf(leaf.lead)?.label ?? null);
    const leafRange = leaf === undefined ? null : describeRange(leaf.lead.videoRange);
    const every = leaf === undefined ? [] : actionsFor(leaf);
    const buttons = every.flat().filter((one) => EPISODE_BUTTONS.includes(one.id));
    const groups = every
      .map((group) =>
        group.filter((one) => one.id !== 'wrong-match' && !EPISODE_BUTTONS.includes(one.id)),
      )
      .filter((group) => group.length > 0);
    const aired = day(openEpisodeOf.airDate);

    return (
      <TitlePartPage
        key={episodeId}
        scope="episode"
        mediaId={episodeId}
        name={name}
        aside={code}
        imageUrl={artworkUrl(episodeId, 'backdrop', { size: 'medium' })}
        trail={[
          mediaCrumb,
          showCrumb,
          { id: 'season', label: seasonName },
          { id: 'here', label: name },
        ]}
        onTrail={(id) => {
          followTrail(id, episodeSeason.season);
        }}
        badges={
          <>
            {quality === null ? null : <Badge size="sm">{quality}</Badge>}
            {leafRange === null ? null : <Badge size="sm">{leafRange}</Badge>}
          </>
        }
        facts={[
          { label: say('common.show'), value: title.name },
          ...(aired === null
            ? []
            : [{ label: say('screens.adminArea.titleDetails.airDate'), value: aired }]),
          ...(leaf === undefined
            ? []
            : [
                {
                  label: say('screens.adminArea.titlePage.trackTable.length'),
                  value: formatDuration(leaf.lead.durationSeconds),
                },
                {
                  label: say('common.size'),
                  value: formatBytes(leaf.lead.sizeBytes ?? 0),
                },
                {
                  label: say('common.added'),
                  value: new Date(leaf.addedAt).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  }),
                },
              ]),
        ]}
        actions={
          <>
            {buttons.map((one) => (
              <Button
                key={one.id}
                variant="secondary"
                size="md"
                disabled={one.isDisabled === true}
                onClick={one.onChoose}
              >
                {one.label}
              </Button>
            ))}
            {groups.length === 0 ? null : (
              <ActionMenu
                label={say('common.actionsForName', { name })}
                size="md"
                groups={groups.map((items) => ({ items }))}
              />
            )}
          </>
        }
        tab={at.tab}
        onTab={(tab) => {
          moveTo({ ...at, tab });
        }}
        filesLabel={say('desktop.main.theApplicationMenu.file')}
        files={
          <PanelCard title={say('desktop.main.theApplicationMenu.file')} isFlush>
            {place === null || file === null ? (
              <DataTable
                label={say('desktop.main.theApplicationMenu.file')}
                columns={fileColumns}
                rows={leaf === undefined ? [] : [leaf]}
                getRowId={(row) => row.id}
              />
            ) : (
              <FolderView
                key={file}
                libraries={libraries}
                mayDelete={mayManageFiles}
                root={folderOf(file)}
                onChanged={() => {
                  onFilesChanged?.();
                }}
                onScan={(scanned) => {
                  onScan?.(scanned);
                }}
                hidesTitles
                keeps={(entry) =>
                  entry.mediaId === episodeId || (fileName !== null && entry.belongsTo === fileName)
                }
                columns={mediaColumns}
                actionsOf={mediaActionsOf}
              />
            )}
          </PanelCard>
        }
        onPrevious={
          before === undefined
            ? undefined
            : () => {
                openEpisode(episodeSeason, before);
              }
        }
        onNext={
          after === undefined
            ? undefined
            : () => {
                openEpisode(episodeSeason, after);
              }
        }
      />
    );
  }

  if (seasonPage !== undefined) {
    const seasonFile = fileOfSeason(seasonPage);
    const seasonName = seasonPage.name ?? nameSeason(seasonPage.season);
    const held = seasonPage.episodes.filter((episode) => episode.part === 'library').length;
    const seasonLeaves = leaves.filter((leaf) => leaf.lead.seasonNumber === seasonPage.season);
    const firstAired = seasonPage.episodes.find((episode) => episode.airDate !== null)?.airDate;
    const aired = day(firstAired ?? null);
    const previousSeason = pagedSeasons[seasonPageAt - 1];
    const nextSeason = pagedSeasons[seasonPageAt + 1];

    return seasonFile === null ? null : (
      <TitlePartPage
        key={`season:${seasonPage.season.toString()}`}
        scope="season"
        mediaId={seasonFile}
        name={seasonName}
        aside={aired === null ? null : (firstAired?.slice(0, 4) ?? null)}
        imageUrl={
          title.posterFrom === null
            ? null
            : artworkUrl(title.posterFrom, 'poster', { size: 'medium' })
        }
        trail={[mediaCrumb, showCrumb, { id: 'here', label: seasonName }]}
        onTrail={(id) => {
          followTrail(id, seasonPage.season);
        }}
        badges={null}
        facts={[
          { label: say('common.show'), value: title.name },
          {
            label: say('common.episodes'),
            value: say('screens.adminArea.titlePage.seasonList.heldOfTotal', {
              held: held.toString(),
              total: seasonPage.episodes.length.toString(),
            }),
          },
          ...(aired === null
            ? []
            : [{ label: say('screens.adminArea.titleDetails.airDate'), value: aired }]),
          {
            label: say('common.size'),
            value: formatBytes(
              seasonLeaves.reduce((sum, leaf) => sum + (leaf.lead.sizeBytes ?? 0), 0),
            ),
          },
        ]}
        actions={null}
        tab={at.tab}
        onTab={(tab) => {
          moveTo({ ...at, tab });
        }}
        filesLabel={say('common.episodes')}
        files={
          <PanelCard title={say('common.episodes')} isFlush>
            <EpisodeTable
              label={seasonName}
              season={seasonPage.season}
              episodes={seasonPage.episodes}
              {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
              onOpenEpisode={(episode) => {
                openEpisode(seasonPage, episode);
              }}
            />
          </PanelCard>
        }
        onPrevious={
          previousSeason === undefined
            ? undefined
            : () => {
                openSeasonPage(previousSeason.season);
              }
        }
        onNext={
          nextSeason === undefined
            ? undefined
            : () => {
                openSeasonPage(nextSeason.season);
              }
        }
      />
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        const chosen = tabs.find((one) => one === next);

        if (chosen !== undefined) {
          moveTo({ ...NOWHERE, tab: chosen });
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

        <MediaTitleHero
          name={title.name}
          aside={title.year === null ? null : title.year.toString()}
          posterUrl={
            title.posterFrom === null
              ? null
              : artworkUrl(title.posterFrom, 'poster', { size: 'medium' })
          }
          badges={
            <>
              {title.isMatched ? null : (
                <Badge size="sm" tone="warning">
                  {say('screens.adminArea.mediaPanel.unmatched')}
                </Badge>
              )}
              {isRefreshing ? (
                <Badge size="sm" tone="busy">
                  {say('screens.adminArea.mediaTitlePage.refreshing')}
                </Badge>
              ) : null}
              {best === null ? null : <Badge size="sm">{best}</Badge>}
              {range === null ? null : <Badge size="sm">{range}</Badge>}
              {title.lead.rating === null || title.lead.rating === undefined ? null : (
                <Badge size="sm">
                  <Icon of={StarIcon} size={12} />
                  {title.lead.rating.toFixed(1)}
                </Badge>
              )}
            </>
          }
          facts={[
            ...(library === null ? [] : [{ label: say('common.library'), value: library.name }]),
            ...(title.kind === 'series'
              ? [{ label: say('common.episodes'), value: describeTitle(title) }]
              : []),
            ...(match === null ? [] : [{ label: say('common.catalogue'), value: match }]),
            {
              label: say('common.added'),
              value: new Date(title.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }),
            },
            { label: say('common.files'), value: leaves.length.toLocaleString() },
            { label: say('common.size'), value: formatBytes(totalBytes) },
          ]}
          actions={
            <>
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
            </>
          }
          tabs={
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
                    { id: 'people', label: say('common.people') },
                    ...(title.isMatched ? [{ id: 'artwork', label: say('common.artwork') }] : []),
                    { id: 'files', label: filesWord },
                    { id: 'history', label: say('common.history') },
                  ],
                },
              ]}
            />
          }
        />

        <TabPanel value="details" travel={travel}>
          <div className="flex flex-col gap-4">
            <TitleDetails
              mediaId={title.lead.id}
              scope="title"
              {...(fix === undefined ? {} : { onFixMatch: fix.onChoose })}
              onShowHistory={() => {
                moveTo({ ...NOWHERE, tab: 'history' });
              }}
            />
            {title.kind === 'series' && title.lead.seriesId === null ? null : (
              <TitleCollections
                subject={
                  title.kind === 'series' && title.lead.seriesId !== null
                    ? { seriesId: title.lead.seriesId }
                    : { mediaItemId: title.lead.id }
                }
                name={title.name}
              />
            )}
          </div>
        </TabPanel>

        {title.kind === 'series' ? (
          <TabPanel value="seasons" travel={travel}>
            <SeasonList
              seasons={seasons}
              {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
              actionsOf={(season) =>
                fileOfSeason(season) === null
                  ? []
                  : [
                      {
                        id: 'edit',
                        label: say('common.editDetails'),
                        onChoose: () => {
                          openSeasonPage(season.season);
                        },
                      },
                    ]
              }
              onOpenEpisode={openEpisode}
              openSeason={at.season}
              onOpenSeason={(season) => {
                moveTo({ ...NOWHERE, tab: 'seasons', season });
              }}
            />
          </TabPanel>
        ) : null}

        <TabPanel value="people" travel={travel}>
          <TitlePeople
            mediaId={title.lead.id}
            onShowHistory={() => {
              moveTo({ ...NOWHERE, tab: 'history' });
            }}
          />
        </TabPanel>

        {title.isMatched ? (
          <TabPanel value="artwork" travel={travel}>
            <PanelCard title={say('screens.adminArea.artworkChooser.picturesOfTheTitle')}>
              <ArtworkChooser
                subject={{
                  mediaId: title.lead.id,
                  name: title.name,
                  isSeries: title.kind === 'series',
                  mediaIds: [...leafIds],
                }}
                onChanged={follow}
              />
            </PanelCard>
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
    </Tabs>
  );
};

MediaTitlePage.displayName = 'MediaTitlePage';

export { MediaTitlePage };
