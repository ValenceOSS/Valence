import { RenameToPatternDialog } from './components/RenameToPatternDialog/RenameToPatternDialog';
import { MergeTitlesDialog } from './components/MergeTitlesDialog/MergeTitlesDialog';
import type { MergeFilm } from './components/MergeTitlesDialog/MergeTitlesDialog.types';
import { ImportSheetDialog } from './components/ImportSheetDialog/ImportSheetDialog';
import { QuickMatchDialog } from './components/QuickMatchDialog/QuickMatchDialog';
import type { QuickMatchTitle } from './components/QuickMatchDialog/QuickMatchDialog.types';
import { searchOfTitleList } from '@ValenceClient/admin/searchOfTitleList';
import { SaveViewDialog } from './components/SaveViewDialog/SaveViewDialog';
import { readSavedViews } from './readSavedViews';
import { saveSavedViews } from './saveSavedViews';
import type { SavedView } from './SavedView.types';
import { WordsManagerDialog } from './components/WordsManagerDialog/WordsManagerDialog';
import { Icon } from '@ValenceUI/Icon';
import {
  Bin as BinFilledIcon,
  Bookmark as BookmarkIcon,
  Copy as CopyFilledIcon,
  EyeOff as EyeOffFilledIcon,
  Film as FilmFilledIcon,
  CursorText as CursorTextFilledIcon,
  FolderArrowRight as FolderArrowRightFilledIcon,
  FolderOpen as FolderOpenIcon,
  Image as ImageFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
  Search as SearchFilledIcon,
  Subtitles as SubtitlesFilledIcon,
  Tape as TapeFilledIcon,
  Pen as PenFilledIcon,
  Tag as TagFilledIcon,
  Lock as LockFilledIcon,
  Unlock as UnlockFilledIcon,
  FolderPlus as FolderPlusFilledIcon,
} from '@keyline-icons/react/fill';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { librariesByPlace } from '@ValenceClient/library/librariesByPlace';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { LeaveOutDialog } from '@ValenceScreens/components/AdminArea/components/LeaveOutDialog/LeaveOutDialog';
import type { LeaveOutTarget } from '@ValenceScreens/components/AdminArea/components/LeaveOutDialog/LeaveOutDialog.types';
import { FindSubtitlesDialog } from '@ValenceScreens/components/FindSubtitlesDialog/FindSubtitlesDialog';
import { MoveToLibraryDialog } from '@ValenceScreens/components/AdminArea/components/MoveToLibraryDialog/MoveToLibraryDialog';
import type { MoveTarget } from '@ValenceScreens/components/AdminArea/components/MoveToLibraryDialog/MoveToLibraryDialog.types';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectionBar } from '@ValenceUI/SelectionBar';
import { notify } from '@ValenceUI/notify';
import { BulkEditDialog } from './components/BulkEditDialog/BulkEditDialog';
import { OrphanedEditsDialog } from './components/OrphanedEditsDialog/OrphanedEditsDialog';
import { RefreshTitleDialog } from './components/MediaTitlePage/components/RefreshTitleDialog/RefreshTitleDialog';
import { AddTagsDialog } from './components/AddTagsDialog/AddTagsDialog';
import { AddToCollectionDialog } from '@ValenceScreens/components/AddToCollectionDialog/AddToCollectionDialog';
import { editTitlesInParts } from '@ValenceClient/admin/editTitlesInParts';
import { undoTitlesInParts } from '@ValenceClient/admin/undoTitlesInParts';
import { refreshTitle } from '@ValenceClient/admin/refreshTitle';
import type {
  BulkTarget,
  BulkTitleChange,
  BulkTitleEditOutcome,
} from '@ValenceContracts/schemas/BulkTitleEdit';
import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { AppliedFilters } from '@ValenceUI/AppliedFilters';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Columns3 as Columns3Icon } from '@keyline-icons/react';
import { filterGroupsOf } from './filterGroupsOf';
import { readHiddenColumns } from './readHiddenColumns';
import { saveHiddenColumns } from './saveHiddenColumns';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { describeRange } from '@ValenceClient/library/describeRange';
import { cn } from '@ValenceUI/cn';
import { RowFoldButton } from '@ValenceScreens/components/AdminArea/components/RowFoldButton/RowFoldButton';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { FolderView } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/FolderView/FolderView';
import { Tabs } from '@ValenceUI/Tabs';
import { ScopedField } from '@ValenceUI/ScopedField';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { OriginBadge } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/OriginBadge/OriginBadge';
import { MediaPoster } from './components/MediaPoster/MediaPoster';
import { MediaTitlePage } from './components/MediaTitlePage/MediaTitlePage';
import { describeAudio } from './describeAudio';
import { describeNumber } from './describeNumber';
import { describeTitle } from './describeTitle';
import { filesOf } from './filesOf';
import { lengthOf } from './lengthOf';
import { sharedOf } from './sharedOf';
import { ShelfTable } from './components/ShelfTable/ShelfTable';
import { folderOf } from '@ValenceCore/functions/folderOf';
import { gatherTitles } from './gatherTitles';
import { pathInLibrary } from '@ValenceScreens/components/AdminArea/pathInLibrary';
import { titleFolderOf } from '@ValenceCore/functions/titleFolderOf';
import { bookFolderOf } from './bookFolderOf';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { ListPlace, MediaPanelProps, MediaView, MediaReading } from './MediaPanel.types';
import { TITLE_SORTS } from '@ValenceContracts/schemas/TitleList';
import type { TitleFiles, TitleShow, TitleSort } from '@ValenceContracts/schemas/TitleList';
import type { UseQueryResult } from '@tanstack/react-query';
import { titleOfRow } from './titleOfRow';
import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import type { MediaTitle } from './MediaTitle.types';
import { describeTitleProblems } from './describeTitleProblems';
import type { TitleProblem } from './describeTitleProblems';
import type { ShelfItem } from './ShelfItem.types';
import { say } from '@ValenceI18n/say';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { sayCount } from '@ValenceI18n/sayCount';

const MEDIA_VIEWS = ['titles', 'folders'] as const;

const NOWHERE: TitlePlace = { tab: 'details', season: null, episode: null, isSeasonPage: false };

const NO_PATHS: Readonly<Record<string, string>> = {};

const TAB_ORDER: readonly string[] = ['movies', 'shows', 'anime', 'music', 'books'];

const NO_ALBUMS: readonly MusicAlbum[] = [];

const NO_BOOKS: readonly Book[] = [];

const SHOWING: readonly { id: TitleShow; label: (count: number) => string }[] = [
  { id: 'all', label: (count) => sayCount('screens.adminArea.mediaPanel.count.allTitles', count) },
  { id: 'look', label: (count) => sayCount('screens.adminArea.mediaPanel.count.unmatched', count) },
  {
    id: 'twice',
    label: (count) => sayCount('screens.adminArea.mediaPanel.count.duplicates', count),
  },
  {
    id: 'unreadable',
    label: (count) => sayCount('screens.adminArea.mediaPanel.count.unreadable', count),
  },
  { id: 'edited', label: (count) => sayCount('screens.adminArea.mediaPanel.count.edited', count) },
];

const EVERYWHERE: ListPlace = {
  library: null,
  search: '',
  show: 'all',
  sort: 'title',
  isDescending: false,
  filters: [],
};

/**
 * The sort a column of the list puts the titles in order by, its id being the sort's name.
 *
 * @param id - The column.
 * @returns The sort, or by title where the column sorts by nothing of its own.
 */
const sortOfColumn = (id: string): TitleSort =>
  TITLE_SORTS.find((sort) => sort === id) ?? TITLE_SORTS[0];

const NO_ROWS: readonly MediaTitle[] = [];

const HIDEABLE: readonly string[] = [
  'quality',
  'codec',
  'audio',
  'length',
  'size',
  'origin',
  'added',
];

const SEARCH_SETTLES_MS = 250;

/**
 * Gathers the files read for the titles opened in the list into each title, with where its files
 * are, by the title's id.
 *
 * @param results - What was read for each title opened.
 * @returns Each title read, by its id.
 */
const fullTitlesOf = (
  results: readonly UseQueryResult<TitleFiles>[],
): ReadonlyMap<string, { title: MediaTitle; paths: Readonly<Record<string, string>> }> =>
  new Map(
    results.flatMap((result) => {
      const title = result.data === undefined ? undefined : gatherTitles(result.data.files)[0];

      return title === undefined || result.data === undefined
        ? []
        : [[title.id, { title, paths: result.data.paths }] as const];
    }),
  );

const NO_IDS: ReadonlySet<string> = new Set();

const NOTHING_TO_READ: MediaReading = {
  libraries: false,
  files: false,
  albums: false,
  books: false,
};

const PROBLEM_NAMES: Readonly<Record<TitleProblem, string>> = {
  unmatched: say('screens.adminArea.mediaPanel.unmatched'),
  noPoster: say('screens.adminArea.mediaPanel.noPoster'),
  twice: say('screens.adminArea.mediaPanel.thereTwice'),
  unreadable: say('screens.adminArea.mediaPanel.couldNotBeRead'),
};

const INDENTS: readonly string[] = ['', 'pl-9', 'pl-[4.5rem]'];

/**
 * Everything the libraries hold, one library at a time, each title with its poster: every film on
 * its own, and every series once, opening to show every episode on the disk season by season.
 * What can be done to a file is done to that file — rebuilding its previews, choosing its preview
 * moment, re-encoding it, deleting it — while a series' own row corrects its match, re-encodes every
 * episode or deletes the lot. A music library lists its albums and a book library its books, each
 * with its cover and a way to correct its match. What has no catalogue match or no artwork can be
 * narrowed to, since that is what an administrator comes here to fix.
 *
 * @param isUnreachable - Whether the service is not answering.
 * @param freshness - Whether what is shown, kept from last time, is being checked against the server.
 * @param stillReading - Which of what it lists has not been read for the first time yet, so a
 *   library still being read is not said to be empty.
 * @param libraries - The libraries, each of which gets a tab.
 * @param albums - Every album in the music libraries.
 * @param books - Every book in the book libraries.
 * @param onCorrect - Called with the item whose match is to be corrected.
 * @param onChooseArtwork - Called with what to choose artwork for, where offered.
 * @param onCorrectAlbum - Called with the album whose match is to be corrected, where offered.
 * @param onCorrectBook - Called with the book whose match is to be corrected, where offered.
 * @param onChooseMoment - Called with the item whose preview moment is to be chosen.
 * @param onRebuildArtefacts - Called with the item whose previews and thumbnails are to be remade,
 *   answering whether the request was accepted.
 * @param openedTitle - The title open on a page of its own, where one is.
 * @param onOpenTitle - Called with the title to open, or null to go back; where it is not given, the
 *   page keeps which title is open itself.
 * @param view - Whether titles or folders are shown, where the address keeps it.
 * @param onView - Told which is to be shown, where the address keeps it.
 * @param folder - The folder open in the folder view, where the address keeps it.
 * @param onFolder - Told which folder the folder view has open.
 * @param mayManageFiles - Whether whoever is looking may delete and move files in the folder view.
 * @param onFilesChanged - Told that something on the disk changed in the folder view.
 * @param onScan - Asked to scan a library once something is uploaded into it.
 * @param titlePlace - Which tab, season and episode of the open title to show, where the address
 *   keeps them.
 * @param onTitlePlace - Called with where the open title has moved to.
 * @param onReencode - Called with the files to be re-encoded, where re-encoding is offered at all.
 * @param onShowCopies - Called with the file whose kept copies are to be shown, where offered.
 * @param onDelete - Called with the file to delete, and whether its whole series goes with it, where
 *   deleting is offered at all, answering whether it went.
 * @param paths - Where each item's file is, by the item, where they have been read.
 * @param onOpenFolder - Called with a folder to open in Files, where the file manager is offered.
 * @param onMoved - Told the library media went to and the job reading it there, once moved; where
 *   it is not given, nothing offers to move.
 * @param onOpenInCatalogue - Called with where a title is in the Catalogue, to open it there.
 */
const MediaPanel = ({
  isUnreachable = false,
  freshness,
  stillReading = NOTHING_TO_READ,
  libraries,
  albums = NO_ALBUMS,
  books = NO_BOOKS,
  onCorrect,
  onChooseArtwork,
  onCorrectAlbum,
  onCorrectBook,
  onChooseMoment,
  onRebuildArtefacts,
  openedTitle = null,
  onOpenTitle,
  titlePlace,
  onTitlePlace,
  view: givenView,
  listPlace,
  onListPlace,
  onView,
  folder = null,
  onFolder,
  mayManageFiles = false,
  onFilesChanged,
  onScan,
  onReencode,
  onShowCopies,
  onDelete,
  paths: givenPaths = NO_PATHS,
  onOpenFolder,
  onMoved,
  onOpenInCatalogue,
}: MediaPanelProps) => {
  const tabs = useMemo(
    () =>
      [...libraries].sort(
        (left, right) =>
          TAB_ORDER.indexOf(left.kind) - TAB_ORDER.indexOf(right.kind) ||
          left.name.localeCompare(right.name),
      ),
    [libraries],
  );
  const faces = useQuery(linkingQueries.faces());
  const cache = useQueryClient();
  const withFiles = useCallback(
    async (title: MediaTitle): Promise<MediaTitle> => {
      if (title.row === undefined) {
        return title;
      }

      const files = await cache.fetchQuery(adminQueries.titleFiles(title.id));

      return gatherTitles(files.files)[0] ?? title;
    },
    [cache],
  );
  const [localList, setLocalList] = useState<ListPlace>(EVERYWHERE);
  const list = listPlace ?? localList;
  const setList = onListPlace ?? setLocalList;
  const chosenLibrary = list.library;

  /**
   * Chooses the library listed.
   *
   * @param library - The library.
   */
  const setChosenLibrary = (library: string) => {
    setList({ ...list, library, show: 'all', filters: [] });
  };
  const holdingFolder =
    folder === null
      ? undefined
      : tabs
          .filter((one) => folder === one.path || folder.startsWith(`${one.path}/`))
          .sort((one, other) => other.path.length - one.path.length)[0];
  const libraryId =
    holdingFolder?.id ??
    (tabs.some((library) => library.id === chosenLibrary)
      ? (chosenLibrary ?? '')
      : (tabs[0]?.id ?? ''));
  const { search, show: showing } = list;

  /**
   * Changes what the list is searched for.
   *
   * @param next - The words.
   */
  const setSearch = (next: string) => {
    setList({ ...list, search: next });
  };

  /**
   * Changes which titles the quick filter shows.
   *
   * @param next - The quick filter.
   */
  const setShowing = (next: TitleShow) => {
    setList({ ...list, show: next });
  };

  const settledSearch = useSettled(search, SEARCH_SETTLES_MS);
  const narrowing = `${libraryId}\n${search}\n${showing}\n${list.filters.join('\n')}`;
  const [picking, setPicking] = useState<{ narrowing: string; ids: ReadonlySet<string> }>({
    narrowing,
    ids: NO_IDS,
  });
  const picked = picking.narrowing === narrowing ? picking.ids : NO_IDS;
  const setPicked = useCallback(
    (ids: ReadonlySet<string>) => {
      setPicking({ narrowing, ids });
    },
    [narrowing],
  );
  const [localView, setLocalView] = useState<MediaView>('titles');
  const view = givenView ?? localView;
  const travel = useTravelDirection([...MEDIA_VIEWS], view);
  const [localOpenedId, setLocalOpenedId] = useState<string | null>(null);
  const [localPlace, setLocalPlace] = useState<TitlePlace>(NOWHERE);
  const openedId = onOpenTitle === undefined ? localOpenedId : openedTitle;
  const place = titlePlace ?? localPlace;
  const moveTo = onTitlePlace ?? setLocalPlace;
  const setOpenedId = useCallback(
    (id: string | null, at: TitlePlace = NOWHERE) => {
      if (onOpenTitle === undefined) {
        setLocalOpenedId(id);
        setLocalPlace(at);
      } else {
        onOpenTitle(id, at);
      }
    },
    [onOpenTitle],
  );
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaSummary | null>(null);
  const [rebuildingSeries, setRebuildingSeries] = useState<MediaTitle | null>(null);
  const [rebuilt, setRebuilt] = useState<ReadonlySet<string>>(new Set());
  const [condemned, setCondemned] = useState<{
    item: MediaSummary;
    name: string;
    isWholeSeries: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leaving, setLeaving] = useState<LeaveOutTarget | null>(null);
  const [moving, setMoving] = useState<MoveTarget | null>(null);
  const [subtitling, setSubtitling] = useState<{ id: string; name: string } | null>(null);
  const [refreshingTitle, setRefreshingTitle] = useState<MediaTitle | null>(null);
  const [isSeeingOrphans, setIsSeeingOrphans] = useState(false);
  const [isManagingWords, setIsManagingWords] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [merging, setMerging] = useState<readonly MergeFilm[] | null>(null);
  const [quickMatching, setQuickMatching] = useState<readonly QuickMatchTitle[] | null>(null);
  const [renaming, setRenaming] = useState<readonly string[] | null>(null);
  const [askingOfPicked, setAskingOfPicked] = useState<'refresh' | 'rebuild' | null>(null);

  const renameAction = useCallback(
    (title: MediaTitle): ActionMenuItem => ({
      id: 'rename-to-pattern',
      label: say('screens.adminArea.renameToPattern.renameToTheNamingPatternEllipsis'),
      icon: <Icon of={CursorTextFilledIcon} size={15} />,
      onChoose: () => {
        void withFiles(title).then((full) => {
          setRenaming(filesOf(full).map((file) => file.id));
        });
      },
    }),
    [withFiles],
  );

  const moveAll = useCallback(
    (title: MediaTitle): ActionMenuItem[] =>
      onMoved === undefined
        ? []
        : [
            {
              id: 'move',
              label: say('screens.adminArea.mediaPanel.moveToAnotherLibrary'),
              icon: <Icon of={FolderArrowRightFilledIcon} size={15} />,
              onChoose: () => {
                void withFiles(title).then((full) => {
                  setMoving({
                    items: full.episodes,
                    name: title.name,
                    libraryId: title.libraryId,
                  });
                });
              },
            },
          ],
    [onMoved, withFiles],
  );

  const moveItem = useCallback(
    (items: readonly MediaSummary[], name: string): ActionMenuItem[] =>
      onMoved === undefined || items.length === 0
        ? []
        : [
            {
              id: 'move',
              label: say('screens.adminArea.mediaPanel.moveToAnotherLibrary'),
              icon: <Icon of={FolderArrowRightFilledIcon} size={15} />,
              onChoose: () => {
                setMoving({ items, name, libraryId: items[0]?.libraryId ?? '' });
              },
            },
          ],
    [onMoved],
  );

  const chosen = tabs.find((library) => library.id === libraryId) ?? null;
  const libraryPath = chosen?.path ?? null;
  const isShelf = chosen?.kind === 'music' || chosen?.kind === 'books';
  const asked = {
    libraryId: chosen === null || isShelf ? '' : libraryId,
    sort: list.sort,
    isDescending: list.isDescending,
    search: settledSearch,
    show: showing,
    filters: list.filters,
  };
  const pages = useInfiniteQuery(adminQueries.titlePages(asked));
  const counts = pages.data?.pages[0]?.counts;
  const total = pages.data?.pages.at(-1)?.total ?? 0;
  const listedRows = useMemo(
    () => pages.data?.pages.flatMap((page) => page.titles) ?? [],
    [pages.data],
  );
  const leadPaths = useMemo(
    () =>
      listedRows.flatMap((row) =>
        row.leadPath === null || row.episodes > 0 ? [] : [row.leadPath],
      ),
    [listedRows],
  );
  const origins = useQuery(adminQueries.mediaOrigins(leadPaths)).data;
  const [opening, setOpening] = useState<ReadonlySet<string>>(NO_IDS);
  const openingIds = [...opening];
  const fullOf = useQueries({
    queries: openingIds.map((id) => adminQueries.titleFiles(id)),
    combine: fullTitlesOf,
  });
  const shown = useMemo(
    (): readonly MediaTitle[] =>
      listedRows.map((row) => {
        const full = fullOf.get(row.id);

        return full === undefined ? titleOfRow(row) : { ...full.title, row };
      }),
    [listedRows, fullOf],
  );
  const openTitle = useQuery(adminQueries.titleFiles(openedId));
  const openedPaths = openTitle.data?.paths;
  const paths = useMemo(
    () => ({
      ...givenPaths,
      ...Object.fromEntries(
        listedRows.flatMap((row) => (row.leadPath === null ? [] : [[row.lead.id, row.leadPath]])),
      ),
      ...Object.fromEntries([...fullOf.values()].flatMap((full) => Object.entries(full.paths))),
      ...openedPaths,
    }),
    [givenPaths, listedRows, fullOf, openedPaths],
  );
  const topOf = new Map<string, MediaTitle>();

  /**
   * Notes the title every row beneath a title belongs to.
   *
   * @param top - The title.
   * @param below - The rows beneath it.
   */
  const noteTops = (top: MediaTitle, below: readonly MediaTitle[]) => {
    for (const part of below) {
      topOf.set(part.id, top);
      noteTops(top, part.parts);
    }
  };

  for (const title of shown) {
    noteTops(title, title.parts);
  }

  /**
   * Which files of a title's own are there twice or could not be read, as the server listed it.
   *
   * @param title - A title, or any row beneath one.
   * @returns Its problem files, or nothing where they are not known.
   */
  const problemsOf = (title: MediaTitle) => {
    const row = (topOf.get(title.id) ?? title).row;

    return row === undefined
      ? null
      : {
          duplicate: { items: row.problemFiles.duplicate },
          unreadable: { items: row.problemFiles.unreadable },
        };
  };

  const problemCounts = useQuery(adminQueries.libraryProblems());
  const orphans = useQuery(
    adminQueries.orphanedEdits(asked.libraryId === '' ? null : asked.libraryId),
  );
  const orphanCount = orphans.data?.orphans.length ?? 0;
  const choices = useQuery(
    adminQueries.titleChoices(asked.libraryId === '' ? null : asked.libraryId),
  );
  const [hiddenColumns, setHiddenColumns] = useState<readonly string[]>(readHiddenColumns);
  const [savedViews, setSavedViews] = useState<readonly SavedView[]>(readSavedViews);
  const [isSavingView, setIsSavingView] = useState(false);
  const columnNames: Readonly<Record<string, string>> = {
    quality: say('common.quality'),
    codec: say('common.video'),
    audio: say('common.audio'),
    length: say('screens.adminArea.titlePage.trackTable.length'),
    size: say('common.size'),
    origin: say('screens.adminArea.folderView.from'),
    added: say('common.added'),
  };
  const toFix = new Map(
    (problemCounts.data?.libraries ?? []).map((one) => [one.libraryId, one.titles]),
  );

  /**
   * Opens a title's rows beneath it, reading its files first where they have not been read.
   *
   * @param title - The title.
   */
  const readBeneath = (title: MediaTitle) => {
    if (!opening.has(title.id)) {
      setOpening(new Set([...opening, title.id]));
    }
  };

  const shelved = useMemo((): ShelfItem[] => {
    if (chosen?.kind === 'music') {
      return albums
        .filter((album) => album.libraryId === chosen.id)
        .map((album) => {
          const folder = titleFolderOf([paths[album.id]].filter((file) => file !== undefined));

          return {
            id: album.id,
            name: album.title,
            year: album.year,
            detail: [
              album.artist.name,
              sayCount('common.count.tracks', album.trackCount),
              formatDuration(album.durationSeconds),
            ].join(' · '),
            cover: album.hasArtwork ? albumArtworkUrl(album.id) : null,
            isSquare: true,
            sizeBytes: album.sizeBytes > 0 ? album.sizeBytes : null,
            addedAt: album.addedAt,
            onCorrect:
              onCorrectAlbum === undefined
                ? null
                : () => {
                    onCorrectAlbum(album);
                  },
            place: folder === null ? null : { shown: pathInLibrary(folder, libraryPath), folder },
          };
        });
    }

    if (chosen?.kind === 'books') {
      return books
        .filter((book) => book.libraryId === chosen.id)
        .map((book) => ({
          id: book.id,
          name: book.title,
          year: book.year,
          detail: [
            ...(book.authors === null || book.authors.length === 0
              ? []
              : [book.authors.join(', ')]),
            sayCount('common.count.chapters', book.chapterCount),
          ].join(' · '),
          cover: book.hasCover ? bookCoverUrl(book.id) : null,
          isSquare: false,
          sizeBytes: book.sizeBytes === undefined || book.sizeBytes === 0 ? null : book.sizeBytes,
          addedAt: book.addedAt,
          onCorrect:
            onCorrectBook === undefined
              ? null
              : () => {
                  onCorrectBook(book);
                },
          place:
            paths[book.id] === undefined
              ? null
              : {
                  shown: pathInLibrary(paths[book.id] ?? '', libraryPath),
                  folder: bookFolderOf(paths[book.id] ?? ''),
                },
        }));
    }

    return [];
  }, [albums, books, chosen, libraryPath, onCorrectAlbum, onCorrectBook, paths]);

  const shelfShown = useMemo(() => {
    const words = search.trim().toLowerCase();

    return shelved.filter(
      (item) =>
        (showing === 'all' || item.cover === null) &&
        (words === '' || item.name.toLowerCase().includes(words)),
    );
  }, [shelved, search, showing]);

  const placeOf = useCallback(
    (title: MediaTitle): { shown: string; folder: string } | null => {
      if (title.row !== undefined && title.parts.length === 0) {
        const shown =
          title.kind === 'film' && title.row.leadPath !== null
            ? title.row.leadPath
            : title.row.folder;

        return title.row.folder === null || shown === null
          ? null
          : { shown: pathInLibrary(shown, libraryPath), folder: title.row.folder };
      }

      if (title.kind === 'film') {
        const file = paths[title.lead.id];

        return file === undefined
          ? null
          : { shown: pathInLibrary(file, libraryPath), folder: folderOf(file) };
      }

      const folder = titleFolderOf(
        title.episodes.map((episode) => paths[episode.id]).filter((file) => file !== undefined),
      );

      return folder === null ? null : { shown: pathInLibrary(folder, libraryPath), folder };
    },
    [libraryPath, paths],
  );

  const rebuild = useCallback(
    async (item: MediaSummary) => {
      setRebuilding(item.id);

      const thrownAway = await onRebuildArtefacts(item);

      setRebuilding(null);

      if (thrownAway) {
        setRebuilt((known) => new Set(known).add(item.id));
      }
    },
    [onRebuildArtefacts],
  );

  const leaveOutItems = useCallback(
    (path: string | undefined, name: string, isFolder: boolean): ActionMenuItem[] =>
      path === undefined || libraryPath === null
        ? []
        : [
            {
              id: 'leave-out',
              label: say('common.leaveOutOfTheLibrary'),
              icon: <Icon of={EyeOffFilledIcon} size={15} />,
              onChoose: () => {
                setLeaving({ libraryId, libraryPath, path, name, isFolder });
              },
            },
          ],
    [libraryId, libraryPath],
  );

  const fileActions = useCallback(
    (item: MediaSummary, name: string): ActionMenuItem[][] =>
      [
        [
          ...(paths[item.id] === undefined || onOpenFolder === undefined
            ? []
            : [
                {
                  id: 'show-in-files',
                  label: say('screens.adminArea.mediaPanel.showInFiles'),
                  icon: <Icon of={FolderOpenIcon} size={15} />,
                  onChoose: () => {
                    onOpenFolder(folderOf(paths[item.id] ?? ''));
                  },
                },
              ]),
          {
            id: 'rebuild',
            label:
              rebuilding === item.id
                ? say('screens.adminArea.mediaPanel.rebuilding')
                : rebuilt.has(item.id)
                  ? say('screens.adminArea.mediaPanel.willRebuild')
                  : say('screens.adminArea.mediaPanel.rebuildPreviews'),
            icon: <Icon of={RefreshCwFilledIcon} size={15} />,
            isDisabled: rebuilding === item.id,
            onChoose: () => {
              setConfirming(item);
            },
          },
          {
            id: 'find-subtitles',
            label: say('screens.videoPlayer.playerControls.findSubtitles'),
            icon: <Icon of={SubtitlesFilledIcon} size={15} />,
            onChoose: () => {
              setSubtitling({ id: item.id, name });
            },
          },
          {
            id: 'preview-moment',
            label: say('common.chooseThePreviewMoment'),
            icon: <Icon of={FilmFilledIcon} size={15} />,
            onChoose: () => {
              onChooseMoment(item);
            },
          },
          ...(onReencode === undefined
            ? []
            : [
                {
                  id: 'reencode',
                  label: say('screens.adminArea.mediaPanel.reEncode'),
                  icon: <Icon of={TapeFilledIcon} size={15} />,
                  onChoose: () => {
                    onReencode([item]);
                  },
                },
              ]),
          ...(onShowCopies === undefined
            ? []
            : [
                {
                  id: 'kept-copies',
                  label: say('screens.adminArea.keptCopiesDialog.keptCopies'),
                  icon: <Icon of={CopyFilledIcon} size={15} />,
                  onChoose: () => {
                    onShowCopies(item, name);
                  },
                },
              ]),
        ],
        [
          ...moveItem([item], name),
          ...leaveOutItems(paths[item.id], name, false),
          ...(onDelete === undefined
            ? []
            : [
                {
                  id: 'delete',
                  label: say('screens.adminArea.mediaPanel.deleteFile2'),
                  icon: <Icon of={BinFilledIcon} size={15} />,
                  isDestructive: true,
                  onChoose: () => {
                    setCondemned({ item, name, isWholeSeries: false });
                  },
                },
              ]),
        ],
      ].filter((group) => group.length > 0),
    [
      leaveOutItems,
      moveItem,
      onChooseMoment,
      onDelete,
      onOpenFolder,
      onReencode,
      onShowCopies,
      paths,
      rebuilding,
      rebuilt,
    ],
  );

  const refreshAction = useCallback(
    (title: MediaTitle): ActionMenuItem[] => [
      {
        id: 'refresh',
        label: say('screens.adminArea.mediaPanel.refreshEllipsis'),
        icon: <Icon of={RefreshCwFilledIcon} size={15} />,
        onChoose: () => {
          setRefreshingTitle(title);
        },
      },
    ],
    [],
  );

  const artworkAction = useCallback(
    (title: MediaTitle): ActionMenuItem[] =>
      onChooseArtwork === undefined || !title.isMatched
        ? []
        : [
            {
              id: 'artwork',
              label: say('screens.adminArea.mediaPanel.chooseArtwork'),
              icon: <Icon of={ImageFilledIcon} size={15} />,
              onChoose: () => {
                void withFiles(title).then((full) => {
                  onChooseArtwork({
                    mediaId: title.lead.id,
                    name: title.name,
                    isSeries: title.kind === 'series',
                    mediaIds: full.episodes.map((episode) => episode.id),
                  });
                });
              },
            },
          ],
    [onChooseArtwork, withFiles],
  );

  const seriesActions = useCallback(
    (title: MediaTitle): ActionMenuItem[][] =>
      [
        [
          {
            id: 'wrong-match',
            label: say('common.wrongMatch'),
            icon: <Icon of={SearchFilledIcon} size={15} />,
            onChoose: () => {
              onCorrect(title.lead);
            },
          },
          ...refreshAction(title),
          ...artworkAction(title),
          ...(onReencode === undefined
            ? []
            : [
                {
                  id: 'reencode',
                  label: say('screens.adminArea.mediaPanel.reEncodeEveryEpisode'),
                  icon: <Icon of={TapeFilledIcon} size={15} />,
                  onChoose: () => {
                    void withFiles(title).then((full) => {
                      onReencode(full.episodes);
                    });
                  },
                },
              ]),
          {
            id: 'rebuild-every',
            label: say('screens.adminArea.mediaPanel.rebuildEveryEpisodesPreviews'),
            icon: <Icon of={RefreshCwFilledIcon} size={15} />,
            onChoose: () => {
              setRebuildingSeries(title);
            },
          },
        ],
        [
          renameAction(title),
          ...moveAll(title),
          ...leaveOutItems(placeOf(title)?.folder, title.name, true),
          ...(onDelete === undefined || title.lead.seriesId === null
            ? []
            : [
                {
                  id: 'delete',
                  label: say('screens.adminArea.mediaPanel.deleteSeries2'),
                  icon: <Icon of={BinFilledIcon} size={15} />,
                  isDestructive: true,
                  onChoose: () => {
                    setCondemned({ item: title.lead, name: title.name, isWholeSeries: true });
                  },
                },
              ]),
        ],
      ].filter((group) => group.length > 0),
    [
      artworkAction,
      leaveOutItems,
      moveAll,
      onCorrect,
      onDelete,
      onReencode,
      placeOf,
      refreshAction,
      renameAction,
      withFiles,
    ],
  );

  const actionsFor = useCallback(
    (title: MediaTitle): ActionMenuItem[][] => {
      switch (title.kind) {
        case 'series':
          return seriesActions(title);
        case 'episode':
          return [[renameAction(title)], ...fileActions(title.lead, title.name)];
        case 'version':
          return [
            [renameAction(title)],
            ...fileActions(title.lead, `${title.lead.title}: ${title.name}`),
          ];
        case 'season':
          return [
            [renameAction(title)],
            ...(onReencode === undefined
              ? []
              : [
                  [
                    {
                      id: 'reencode',
                      label: say('screens.adminArea.mediaPanel.reEncodeThisSeason'),
                      icon: <Icon of={TapeFilledIcon} size={15} />,
                      onChoose: () => {
                        onReencode(title.episodes);
                      },
                    },
                  ],
                ]),
          ];
        case 'film':
          return [
            [
              {
                id: 'wrong-match',
                label: say('common.wrongMatch'),
                icon: <Icon of={SearchFilledIcon} size={15} />,
                onChoose: () => {
                  onCorrect(title.lead);
                },
              },
              ...refreshAction(title),
              ...artworkAction(title),
              renameAction(title),
              ...(title.episodes.length > 1 || (title.row?.versions ?? 0) > 0
                ? moveAll(title)
                : []),
            ],
            ...fileActions(title.lead, title.name),
          ];
      }
    },
    [
      artworkAction,
      fileActions,
      moveAll,
      onCorrect,
      onReencode,
      refreshAction,
      renameAction,
      seriesActions,
    ],
  );

  const visible = new Map<string, MediaTitle>();

  /**
   * Notes every row drawn, by its id, beneath the titles too.
   *
   * @param rows - The rows.
   */
  const noteVisible = (rows: readonly MediaTitle[]) => {
    for (const row of rows) {
      visible.set(row.id, row);
      noteVisible(row.parts);
    }
  };

  noteVisible(shown);

  /**
   * Reads every file of the rows ticked, a title's own from the server where they have not been
   * read, each file once however many ticked rows hold it.
   *
   * @returns The files.
   */
  const filesOfPicked = async (): Promise<MediaSummary[]> => {
    const titles = await Promise.all(
      [...picked].map(async (id) => {
        const held = visible.get(id);

        if (held !== undefined && (held.row === undefined || held.parts.length > 0)) {
          return held;
        }

        const files = await cache.fetchQuery(adminQueries.titleFiles(id));

        return gatherTitles(files.files)[0] ?? null;
      }),
    );
    const byId = new Map(
      titles
        .flatMap((title) => (title === null ? [] : filesOf(title)))
        .map((file) => [file.id, file]),
    );

    return [...byId.values()];
  };

  const [lastPicked, setLastPicked] = useState<string | null>(null);
  const shiftHeld = useRef(false);
  const [isPickingAll, setIsPickingAll] = useState(false);
  const [keyed, setKeyed] = useState<
    ReadonlyMap<string, { leadId: string; kind: 'film' | 'show' }>
  >(new Map());
  const [editing, setEditing] = useState<readonly BulkTarget[] | null>(null);
  const [tagging, setTagging] = useState<readonly BulkTarget[] | null>(null);
  const [collecting, setCollecting] = useState<readonly CollectionSubject[] | null>(null);
  const [pickedToDelete, setPickedToDelete] = useState<readonly MediaSummary[] | null>(null);

  /**
   * Ticks or unticks a row, and with Shift held every top row between it and the last one ticked.
   *
   * @param id - The row.
   * @param isChecked - Whether it is now ticked.
   * @param isRange - Whether Shift was held.
   */
  const pick = (id: string, isChecked: boolean, isRange: boolean) => {
    const next = new Set(picked);
    const from = lastPicked === null ? -1 : shown.findIndex((one) => one.id === lastPicked);
    const to = shown.findIndex((one) => one.id === id);
    const ids =
      isRange && from >= 0 && to >= 0
        ? shown.slice(Math.min(from, to), Math.max(from, to) + 1).map((one) => one.id)
        : [id];

    for (const one of ids) {
      if (isChecked) {
        next.add(one);
      } else {
        next.delete(one);
      }
    }

    setPicked(next);
    setLastPicked(id);
  };

  /**
   * Ticks every title the list asks for, those not read yet as well.
   */
  const pickAll = () => {
    setIsPickingAll(true);

    void cache
      .fetchQuery(adminQueries.titleKeys(asked))
      .then((keys) => {
        setKeyed(
          new Map(keys.titles.map((one) => [one.id, { leadId: one.leadId, kind: one.kind }])),
        );
        setPicked(new Set(keys.titles.map((one) => one.id)));
      })
      .finally(() => {
        setIsPickingAll(false);
      });
  };

  /**
   * The list's columns, drawn from what is ticked and open now.
   *
   * @returns The columns.
   */
  const columnsOf = (): DataTableColumn<MediaTitle>[] => {
    const mixed = say('screens.adminArea.mediaPanel.mixed');

    return [
      {
        id: 'choose',
        enableSorting: false,
        meta: { shrinks: true },
        header: () => (
          <Checkbox
            label={say('screens.adminArea.mediaPanel.selectEveryTitleShown')}
            isLabelHidden
            checked={shown.length > 0 && shown.every((one) => picked.has(one.id))}
            isMixed={
              shown.some((one) => picked.has(one.id)) && !shown.every((one) => picked.has(one.id))
            }
            onCheckedChange={(isChecked) => {
              setPicked(new Set(isChecked ? shown.map((one) => one.id) : []));
            }}
          />
        ),
        cell: ({ row }) => (
          <span
            onClickCapture={(event) => {
              shiftHeld.current = event.shiftKey;
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Checkbox
              label={say('screens.adminArea.mediaPanel.selectName', { name: row.original.name })}
              isLabelHidden
              checked={picked.has(row.original.id)}
              onCheckedChange={(isChecked) => {
                pick(row.original.id, isChecked, shiftHeld.current && row.depth === 0);
              }}
            />
          </span>
        ),
      },
      {
        id: 'title',
        meta: { fills: true },
        header: say('common.title'),
        accessorFn: (title) => title.order,
        cell: ({ row }) => {
          const title = row.original;
          const isOpen = row.getIsExpanded();
          const place = title.kind === 'film' || title.kind === 'series' ? placeOf(title) : null;
          const problems = describeTitleProblems(title, problemsOf(title));

          return (
            <span
              className={cn('flex min-w-0 items-center gap-3', INDENTS[row.depth] ?? '')}
              title={place?.shown}
            >
              {title.kind === 'episode' ? (
                <span className="w-10 shrink-0 text-xs tabular-nums text-text-muted">
                  {describeNumber(title.lead)}
                </span>
              ) : title.kind === 'season' || title.kind === 'version' ? null : (
                <MediaPoster
                  className="w-7"
                  src={
                    title.posterFrom === null
                      ? null
                      : artworkUrl(title.posterFrom, 'poster', { size: 'small' })
                  }
                />
              )}

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  {row.depth === 0 ? (
                    <Button
                      variant="bare"
                      size="none"
                      className="truncate font-medium text-text hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenedId(title.id);
                      }}
                    >
                      {title.name}
                    </Button>
                  ) : (
                    <span className="truncate text-sm text-text">{title.name}</span>
                  )}

                  {title.year === null ? null : (
                    <span className="text-sm tabular-nums text-text-muted">{title.year}</span>
                  )}

                  {problems.problems.map((problem) => (
                    <Badge
                      key={problem}
                      size="sm"
                      tone={problem === 'unreadable' ? 'danger' : 'warning'}
                    >
                      {PROBLEM_NAMES[problem]}
                    </Badge>
                  ))}
                </span>

                {title.kind === 'series' ||
                title.kind === 'season' ||
                title.parts.length > 0 ||
                (title.row?.versions ?? 0) > 0 ? (
                  <span className="flex min-w-0 items-center gap-1 text-xs text-text-muted">
                    {row.getCanExpand() ? (
                      <RowFoldButton
                        label={
                          title.kind === 'series'
                            ? say(
                                isOpen
                                  ? 'screens.adminArea.mediaPanel.hideTheEpisodesOfName'
                                  : 'screens.adminArea.mediaPanel.showTheEpisodesOfName',
                                { name: title.name },
                              )
                            : title.kind === 'film' || title.kind === 'episode'
                              ? say(
                                  isOpen
                                    ? 'screens.adminArea.mediaPanel.hideTheEditionsOfName'
                                    : 'screens.adminArea.mediaPanel.showTheEditionsOfName',
                                  { name: title.name },
                                )
                              : say(
                                  isOpen
                                    ? 'screens.adminArea.mediaPanel.hideTheEpisodesInName'
                                    : 'screens.adminArea.mediaPanel.showTheEpisodesInName',
                                  { name: title.name },
                                )
                        }
                        isOpen={isOpen}
                        onToggle={() => {
                          readBeneath(title);
                          row.toggleExpanded();
                        }}
                      />
                    ) : null}
                    <span className="truncate">{describeTitle(title)}</span>
                  </span>
                ) : null}

                {((title.kind === 'series' || title.kind === 'season') && isOpen
                  ? []
                  : problems.details
                ).map((detail) => (
                  <span key={detail} className="text-xs text-warning [overflow-wrap:anywhere]">
                    {detail}
                  </span>
                ))}
              </span>
            </span>
          );
        },
      },
      {
        id: 'quality',
        meta: { hidesOnPhones: true },
        header: say('common.quality'),
        accessorFn: (title) => Math.max(0, ...filesOf(title).map((file) => file.height)),
        cell: ({ row }) => {
          const files = filesOf(row.original);
          const looks = row.original.row?.looks;
          const step =
            looks === undefined
              ? sharedOf(
                  files.map((file) => sharpestStepOf(file)?.label ?? '—'),
                  mixed,
                )
              : looks.isStepMixed
                ? mixed
                : (looks.step ?? '—');
          const range =
            looks === undefined
              ? sharedOf(
                  files.map((file) => describeRange(file.videoRange) ?? ''),
                  mixed,
                )
              : looks.isRangeMixed
                ? mixed
                : (describeRange(looks.range ?? '') ?? '');

          return step === null ? null : (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={cn('tabular-nums', step === mixed ? 'text-text-muted' : 'text-text')}
              >
                {step}
              </span>
              {range === null || range === '' || range === mixed ? null : (
                <Badge size="sm">{range}</Badge>
              )}
            </span>
          );
        },
      },
      {
        id: 'codec',
        meta: { showsOnlyWhenWide: true },
        header: say('common.video'),
        accessorFn: (title) =>
          sharedOf(
            filesOf(title).map((file) => file.videoCodec),
            mixed,
          ) ?? '',
        cell: ({ row }) => {
          const looks = row.original.row?.looks;
          const codec =
            looks === undefined
              ? sharedOf(
                  filesOf(row.original).map((file) => file.videoCodec.toUpperCase()),
                  mixed,
                )
              : looks.isCodecMixed
                ? mixed
                : (looks.codec?.toUpperCase() ?? null);

          return codec === null ? null : (
            <span className="whitespace-nowrap text-text-muted">{codec}</span>
          );
        },
      },
      {
        id: 'audio',
        meta: { showsOnlyWhenWide: true },
        header: say('common.audio'),
        accessorFn: (title) => sharedOf(filesOf(title).map(describeAudio), mixed) ?? '',
        cell: ({ row }) => {
          const looks = row.original.row?.looks;
          const audio =
            looks === undefined
              ? sharedOf(filesOf(row.original).map(describeAudio), mixed)
              : looks.isAudioMixed
                ? mixed
                : describeAudio({ ...row.original.lead, audio: looks.audio });

          return audio === null ? null : (
            <span className="whitespace-nowrap text-text-muted">{audio}</span>
          );
        },
      },
      {
        id: 'length',
        meta: { showsOnlyWhenWide: true },
        header: say('screens.adminArea.titlePage.trackTable.length'),
        accessorFn: lengthOf,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {formatDuration(row.original.row?.durationSeconds ?? lengthOf(row.original))}
          </span>
        ),
      },
      {
        id: 'size',
        header: say('common.size'),
        meta: { hidesOnPhones: true },
        accessorFn: (title) => title.sizeBytes ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'origin',
        meta: { showsOnlyWhenWide: true },
        header: say('screens.adminArea.folderView.from'),
        enableSorting: false,
        cell: ({ row }) => {
          const path = row.original.row?.leadPath;
          const origin = path === null || path === undefined ? undefined : origins?.[path];

          return origin === undefined ? null : <OriginBadge origin={origin} />;
        },
      },
      {
        id: 'added',
        meta: { hidesOnPhones: true },
        header: say('common.added'),
        accessorFn: (title) => title.addedAt,
        cell: ({ row }) => (
          <span
            className="whitespace-nowrap tabular-nums text-text-muted"
            title={new Date(row.original.addedAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          >
            {describeSince(String(row.original.addedAt), Date.now())}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const title = row.original;
          const groups =
            row.depth === 0
              ? [
                  [
                    {
                      id: 'open',
                      label: say('common.open'),
                      onChoose: () => {
                        setOpenedId(title.id);
                      },
                    },
                  ],
                  ...actionsFor(title),
                ]
              : actionsFor(title);

          return groups.length === 0 ? null : (
            <span className="flex justify-end">
              <ActionMenu
                label={say('common.actionsForName', { name: title.name })}
                groups={groups.map((items) => ({ items }))}
              />
            </span>
          );
        },
      },
    ];
  };

  const columns = columnsOf().filter((column) => !hiddenColumns.includes(column.id ?? ''));

  const isNarrowed = settledSearch.trim() !== '' || list.filters.length > 0;
  const held = isShelf ? shelved.length : isNarrowed ? 1 : (counts?.all ?? 0);
  const looking = shelved.filter((item) => item.cover === null).length;
  const emptyMessage =
    held === 0
      ? say('screens.adminArea.mediaPanel.nothingHasBeenScannedIntoThis')
      : showing === 'look'
        ? isShelf
          ? say('screens.adminArea.mediaPanel.everythingHereHasACover')
          : say('screens.adminArea.mediaPanel.everythingHereIsMatchedAndHas')
        : search.trim() !== '' || list.filters.length > 0
          ? say('common.nothingHereMatchesThat')
          : showing === 'twice'
            ? say('screens.adminArea.mediaPanel.noTitleIsHereTwice')
            : showing === 'unreadable'
              ? say('screens.adminArea.mediaPanel.everyFileHereCouldBeRead')
              : showing === 'edited'
                ? say('screens.adminArea.mediaPanel.noTitleHereHasBeenEdited')
                : say('common.nothingHereMatchesThat');

  /**
   * Opens the title a row of the list belongs to: a film or programme on its page, a season on its
   * Seasons tab, an episode in its editor there, and a version on the Files tab.
   *
   * @param row - The row pressed.
   */
  const openRow = (row: MediaTitle) => {
    const top = topOf.get(row.id) ?? row;

    if (row.kind === 'episode') {
      setOpenedId(top.id, {
        ...NOWHERE,
        season: row.lead.seasonNumber ?? null,
        episode: row.lead.id,
      });
    } else if (row.kind === 'season') {
      setOpenedId(top.id, {
        ...NOWHERE,
        season: row.lead.seasonNumber ?? null,
        isSeasonPage: row.lead.seasonNumber !== null && row.lead.seasonNumber !== undefined,
      });
    } else if (row.kind === 'version') {
      setOpenedId(top.id, { ...NOWHERE, tab: 'files' });
    } else {
      setOpenedId(top.id);
    }
  };

  const opened =
    openTitle.data === undefined ? null : (gatherTitles(openTitle.data.files)[0] ?? null);
  const openedAt = openedId === null ? -1 : shown.findIndex((one) => one.id === openedId);
  const before = openedAt > 0 ? shown[openedAt - 1] : undefined;
  const after = openedAt >= 0 ? shown[openedAt + 1] : undefined;

  /**
   * The titles ticked, as the metadata of each is reached: a film or programme by its lead file, a
   * season or an episode by its own.
   *
   * @returns The titles.
   */
  const targetsOfPicked = (): BulkTarget[] =>
    [...picked].flatMap((id): BulkTarget[] => {
      const held = visible.get(id);

      if (held !== undefined) {
        const scope =
          held.kind === 'episode'
            ? 'episode'
            : held.kind === 'season'
              ? 'season'
              : held.kind === 'version' && topOf.get(id)?.kind === 'series'
                ? 'episode'
                : 'title';

        return [{ mediaId: held.lead.id, scope }];
      }

      const key = keyed.get(id);

      return key === undefined ? [] : [{ mediaId: key.leadId, scope: 'title' }];
    });

  const hasPickedShows = [...picked].some(
    (id) => visible.get(id)?.kind === 'series' || keyed.get(id)?.kind === 'show',
  );

  /**
   * Says what a change made to many titles did, with a way to undo all of it.
   *
   * @param outcome - The change.
   */
  const toldChanged = (outcome: BulkTitleEditOutcome) => {
    void cache.invalidateQueries({ queryKey: adminQueries.key });

    if (outcome.changed.length === 0) {
      notify.say(say('screens.adminArea.mediaPanel.nothingNeededChanging'));

      return;
    }

    notify.worked(
      sayCount('screens.adminArea.mediaPanel.count.changedTitles', outcome.changed.length),
      {
        id: `bulk-${outcome.changeSetId}`,
        action: {
          label: say('common.undo'),
          onPress: () => {
            void undoTitlesInParts(outcome.changeSetId, outcome.changed)
              .then((undone) => {
                void cache.invalidateQueries({ queryKey: adminQueries.key });
                notify.worked(sayCount('screens.adminArea.mediaPanel.count.undoneTitles', undone));
              })
              .catch((error: Error) => {
                notify.failed(error.message);
              });
          },
        },
      },
    );
  };

  /**
   * Makes one change to every title ticked, such as locking all their fields, and says so.
   *
   * @param change - The change.
   */
  const changePicked = (change: BulkTitleChange) => {
    void editTitlesInParts(targetsOfPicked(), change)
      .then(toldChanged)
      .catch((error: Error) => {
        notify.failed(error.message);
      });
  };

  /**
   * Asks the catalogue again about every title ticked, keeping their edits, one after another.
   */
  const refreshPicked = () => {
    const targets = targetsOfPicked().filter((one) => one.scope === 'title');

    void (async () => {
      let done = 0;

      for (const target of targets) {
        await refreshTitle(target.mediaId, 'details');
        done += 1;
        notify.say(
          say('screens.adminArea.mediaPanel.refreshingDoneOfCount', {
            done: done.toLocaleString(),
            count: targets.length.toLocaleString(),
          }),
          { id: 'bulk-refresh' },
        );
      }

      void cache.invalidateQueries({ queryKey: adminQueries.key });
    })();
  };

  const unmatchedPicked: QuickMatchTitle[] = [...picked].flatMap((id) => {
    const held = visible.get(id);

    return held === undefined || held.isMatched || (held.kind !== 'film' && held.kind !== 'series')
      ? []
      : [
          {
            mediaId: held.lead.id,
            name: held.name,
            year: held.year,
            kind: held.kind === 'series' ? ('tv' as const) : ('movie' as const),
          },
        ];
  });
  const filmsPicked: MergeFilm[] = [...picked].flatMap((id) => {
    const held = visible.get(id);

    return held?.kind === 'film'
      ? [
          {
            mediaId: held.lead.id,
            name: held.name,
            year: held.year,
            externalId: held.isMatched ? (held.lead.externalId ?? null) : null,
          },
        ]
      : [];
  });
  const moreForPicked: ActionMenuItem[][] = [
    [
      {
        id: 'collection',
        label: say('screens.adminArea.mediaPanel.addToACollection'),
        icon: <Icon of={FolderPlusFilledIcon} size={15} />,
        onChoose: () => {
          setCollecting(
            [...picked].flatMap((id): CollectionSubject[] => {
              const held = visible.get(id);
              const isShow = held?.kind === 'series' || keyed.get(id)?.kind === 'show';
              const lead = held?.lead;

              if (lead !== undefined) {
                return isShow
                  ? lead.seriesId === null
                    ? []
                    : [{ seriesId: lead.seriesId }]
                  : held?.kind === 'film'
                    ? [{ mediaItemId: lead.id }]
                    : [];
              }

              const key = keyed.get(id);

              return key === undefined || key.kind === 'show' ? [] : [{ mediaItemId: key.leadId }];
            }),
          );
        },
      },
      ...(filmsPicked.length < 2
        ? []
        : [
            {
              id: 'merge',
              label: say('screens.adminArea.mergeTitles.mergeIntoOneFilm'),
              icon: <Icon of={CopyFilledIcon} size={15} />,
              onChoose: () => {
                setMerging(filmsPicked);
              },
            },
          ]),
      ...(unmatchedPicked.length === 0
        ? []
        : [
            {
              id: 'quick-match',
              label: say('screens.adminArea.quickMatch.matchAutomatically'),
              icon: <Icon of={SearchFilledIcon} size={15} />,
              onChoose: () => {
                setQuickMatching(unmatchedPicked);
              },
            },
          ]),
      {
        id: 'lock',
        label: say('screens.adminArea.mediaTitlePage.lockAllFields'),
        icon: <Icon of={LockFilledIcon} size={15} />,
        onChoose: () => {
          changePicked({ lockAll: true });
        },
      },
      {
        id: 'unlock',
        label: say('screens.adminArea.mediaPanel.unlockAllFields'),
        icon: <Icon of={UnlockFilledIcon} size={15} />,
        onChoose: () => {
          changePicked({ unlockAll: true });
        },
      },
    ],
    [
      ...(onReencode === undefined
        ? []
        : [
            {
              id: 'reencode',
              label: say('screens.adminArea.mediaPanel.reEncodeSelected'),
              icon: <Icon of={TapeFilledIcon} size={15} />,
              onChoose: () => {
                void filesOfPicked().then(onReencode);
              },
            },
          ]),
      {
        id: 'rebuild',
        label: say('screens.adminArea.mediaPanel.rebuildPreviews'),
        icon: <Icon of={RefreshCwFilledIcon} size={15} />,
        onChoose: () => {
          setAskingOfPicked('rebuild');
        },
      },
      {
        id: 'rename-to-pattern',
        label: say('screens.adminArea.renameToPattern.renameToTheNamingPatternEllipsis'),
        icon: <Icon of={CursorTextFilledIcon} size={15} />,
        onChoose: () => {
          void filesOfPicked().then((files) => {
            setRenaming(files.map((file) => file.id));
          });
        },
      },
      ...(onMoved === undefined
        ? []
        : [
            {
              id: 'move',
              label: say('screens.adminArea.mediaPanel.moveToAnotherLibrary'),
              icon: <Icon of={FolderArrowRightFilledIcon} size={15} />,
              onChoose: () => {
                void filesOfPicked().then((files) => {
                  setMoving({
                    items: files,
                    name: sayCount('common.count.selected', picked.size),
                    libraryId,
                  });
                });
              },
            },
          ]),
    ],
    onDelete === undefined
      ? []
      : [
          {
            id: 'delete',
            label: say('common.delete'),
            icon: <Icon of={BinFilledIcon} size={15} />,
            isDestructive: true,
            onChoose: () => {
              void filesOfPicked().then(setPickedToDelete);
            },
          },
        ],
  ].filter((group) => group.length > 0);

  const selectionActions = (
    <>
      <Button
        variant="secondary"
        size="xs"
        onClick={() => {
          setEditing(targetsOfPicked());
        }}
      >
        <Icon of={PenFilledIcon} size={14} />
        {say('common.edit')}
      </Button>
      <Button
        variant="secondary"
        size="xs"
        onClick={() => {
          setAskingOfPicked('refresh');
        }}
      >
        <Icon of={RefreshCwFilledIcon} size={14} />
        {say('screens.adminArea.refreshTitleDialog.refresh')}
      </Button>
      <Button
        variant="secondary"
        size="xs"
        onClick={() => {
          setTagging(targetsOfPicked());
        }}
      >
        <Icon of={TagFilledIcon} size={14} />
        {say('screens.adminArea.mediaPanel.addTags')}
      </Button>
      <ActionMenu
        size="sm"
        align="start"
        label={say('common.more')}
        groups={moreForPicked.map((items) => ({ items }))}
      />
    </>
  );

  const filterGroups = filterGroupsOf(choices.data, chosen?.kind !== 'movies');
  const chosenFilters = new Set(list.filters);

  /**
   * Changes the filters the list is narrowed by.
   *
   * @param next - The filters, each named as the server reads it.
   */
  const setFilters = (next: ReadonlySet<string>) => {
    setList({ ...list, filters: [...next] });
  };

  const viewsHere = savedViews.filter((view) => view.place.library === libraryId);

  /**
   * Keeps a new list of saved views, on this device.
   *
   * @param next - The views.
   */
  const keepViews = (next: readonly SavedView[]) => {
    setSavedViews(next);
    saveSavedViews(next);
  };

  const listTools = (
    <span className="flex items-center gap-2">
      <ActionMenu
        label={say('screens.adminArea.savedViews.savedViews')}
        size="sm"
        trigger={<Icon of={BookmarkIcon} size={15} />}
        groups={[
          ...(viewsHere.length === 0
            ? []
            : [
                {
                  items: viewsHere.map((view) => ({
                    id: `view:${view.name}`,
                    label: view.name,
                    onChoose: () => {
                      setList({ ...view.place, library: libraryId });
                    },
                  })),
                },
              ]),
          {
            items: [
              {
                id: 'save',
                label: say('screens.adminArea.savedViews.saveThisView'),
                onChoose: () => {
                  setIsSavingView(true);
                },
              },
            ],
          },
          ...(viewsHere.length === 0
            ? []
            : [
                {
                  items: viewsHere.map((view) => ({
                    id: `forget:${view.name}`,
                    label: say('screens.adminArea.savedViews.forgetName', { name: view.name }),
                    onChoose: () => {
                      keepViews(savedViews.filter((one) => one !== view));
                    },
                  })),
                },
              ]),
        ]}
      />
      <FilterMenu
        label={say('screens.adminArea.mediaPanel.filterTheTitles')}
        hasLabel
        groups={filterGroups}
        selected={chosenFilters}
        onChange={setFilters}
      />
      <OptionMenu
        label={say('screens.adminArea.mediaPanel.columns')}
        size="sm"
        triggerShape="icon"
        trigger={<Icon of={Columns3Icon} size={15} />}
        align="end"
        groups={[
          {
            name: say('screens.adminArea.mediaPanel.columns'),
            options: HIDEABLE.map((id) => ({ id, label: columnNames[id] ?? id })),
            selectedIds: HIDEABLE.filter((id) => !hiddenColumns.includes(id)),
            onToggle: (id, isChosen) => {
              const next = isChosen
                ? hiddenColumns.filter((one) => one !== id)
                : [...hiddenColumns, id];

              setHiddenColumns(next);
              saveHiddenColumns(next);
            },
          },
        ]}
      />
    </span>
  );

  const dialogs = (
    <>
      <RefreshTitleDialog
        mediaId={refreshingTitle?.lead.id ?? ''}
        name={refreshingTitle?.name ?? ''}
        kind={refreshingTitle?.kind === 'series' ? 'show' : 'film'}
        isMatched={refreshingTitle?.isMatched ?? false}
        isOpen={refreshingTitle !== null}
        onClose={() => {
          setRefreshingTitle(null);
        }}
        onStarted={() => {
          void cache.invalidateQueries({ queryKey: adminQueries.key });
        }}
      />

      <RenameToPatternDialog
        key={renaming === null ? 'rename-closed' : `rename-${renaming.join()}`}
        mediaIds={renaming}
        onClose={() => {
          setRenaming(null);
        }}
      />

      <MergeTitlesDialog
        key={
          merging === null ? 'merge-closed' : `merge-${merging.map((one) => one.mediaId).join()}`
        }
        films={merging}
        onClose={() => {
          setMerging(null);
        }}
        onMerged={() => {
          setPicked(new Set());
          void cache.invalidateQueries({ queryKey: adminQueries.key });
        }}
      />

      <ImportSheetDialog
        libraryId={isImporting ? asked.libraryId : null}
        onClose={() => {
          setIsImporting(false);
        }}
      />

      <QuickMatchDialog
        titles={quickMatching}
        onClose={() => {
          setQuickMatching(null);
        }}
        onFixMatch={(mediaId) => {
          const lead = [...visible.values()].find((one) => one.lead.id === mediaId)?.lead;

          if (lead !== undefined) {
            onCorrect(lead);
          }
        }}
        onMatched={() => {
          void cache.invalidateQueries({ queryKey: adminQueries.key });
        }}
      />

      <SaveViewDialog
        isOpen={isSavingView}
        onClose={() => {
          setIsSavingView(false);
        }}
        onSave={(name) => {
          setIsSavingView(false);
          keepViews([
            ...savedViews.filter((one) => one.name !== name || one.place.library !== libraryId),
            { name, place: { ...list, library: libraryId } },
          ]);
        }}
      />

      <WordsManagerDialog
        libraryId={isManagingWords ? asked.libraryId : null}
        onClose={() => {
          setIsManagingWords(false);
        }}
      />
      <OrphanedEditsDialog
        libraryId={libraryId}
        isOpen={isSeeingOrphans}
        onClose={() => {
          setIsSeeingOrphans(false);
        }}
      />

      <BulkEditDialog
        targets={editing}
        hasShows={hasPickedShows}
        libraryId={libraryId}
        onClose={() => {
          setEditing(null);
        }}
        onDone={toldChanged}
      />

      <AddTagsDialog
        targets={tagging}
        libraryId={libraryId}
        onClose={() => {
          setTagging(null);
        }}
        onDone={toldChanged}
      />

      <AddToCollectionDialog
        subject={collecting}
        title={sayCount('common.count.titles', collecting?.length ?? 0)}
        onClose={() => {
          setCollecting(null);
        }}
      />

      <FindSubtitlesDialog
        media={subtitling}
        onClose={() => {
          setSubtitling(null);
        }}
      />

      <MoveToLibraryDialog
        target={moving}
        libraries={libraries}
        onClose={() => {
          setMoving(null);
        }}
        onMoved={(toLibraryId, jobId) => {
          setMoving(null);
          onMoved?.(toLibraryId, jobId);
        }}
      />

      <LeaveOutDialog
        target={leaving}
        onClose={() => {
          setLeaving(null);
        }}
      />

      <ConfirmDialog
        isOpen={askingOfPicked !== null}
        title={
          askingOfPicked === 'rebuild'
            ? sayCount('screens.adminArea.mediaPanel.count.rebuildThePreviewsOfTitles', picked.size)
            : sayCount('screens.adminArea.mediaPanel.count.updateTheDetailsOfTitles', picked.size)
        }
        detail={
          askingOfPicked === 'rebuild'
            ? say('screens.adminArea.mediaPanel.itsPreviewsAndThumbnailsAreThrown')
            : say('screens.adminArea.refreshTitleDialog.updateDetailsDetail')
        }
        confirmLabel={
          askingOfPicked === 'rebuild'
            ? say('screens.adminArea.mediaPanel.rebuildPreviews')
            : say('screens.adminArea.refreshTitleDialog.updateDetails')
        }
        onClose={() => {
          setAskingOfPicked(null);
        }}
        onConfirm={() => {
          if (askingOfPicked === 'rebuild') {
            void filesOfPicked().then((files) => {
              for (const file of files) {
                void rebuild(file);
              }
            });
          } else {
            refreshPicked();
          }

          setAskingOfPicked(null);
        }}
      />

      <ConfirmDialog
        isOpen={rebuildingSeries !== null}
        title={say('screens.adminArea.mediaPanel.rebuildThePreviewsForTitle', {
          title: rebuildingSeries?.name ?? '',
        })}
        detail={say('screens.adminArea.mediaPanel.itsPreviewsAndThumbnailsAreThrown')}
        confirmLabel={say('screens.adminArea.mediaPanel.rebuildPreviews')}
        isDestructive
        onClose={() => {
          setRebuildingSeries(null);
        }}
        onConfirm={() => {
          if (rebuildingSeries !== null) {
            void withFiles(rebuildingSeries).then((full) => {
              for (const episode of full.episodes) {
                void rebuild(episode);
              }
            });
          }

          setRebuildingSeries(null);
        }}
      />

      <ConfirmDialog
        isOpen={confirming !== null}
        title={
          confirming === null
            ? say('screens.adminArea.mediaPanel.rebuildThePreviewsForThisTitle')
            : say('screens.adminArea.mediaPanel.rebuildThePreviewsForTitle', {
                title: confirming.title,
              })
        }
        detail={say('screens.adminArea.mediaPanel.itsPreviewsAndThumbnailsAreThrown')}
        confirmLabel={say('screens.adminArea.mediaPanel.rebuildPreviews')}
        isDestructive
        isBusy={rebuilding !== null}
        onClose={() => {
          setConfirming(null);
        }}
        onConfirm={() => {
          if (confirming === null) {
            return;
          }

          void rebuild(confirming).then(() => {
            setConfirming(null);
          });
        }}
      />

      {onDelete === undefined ? null : (
        <ConfirmDialog
          isOpen={condemned !== null}
          title={
            condemned?.isWholeSeries === true
              ? say('screens.adminArea.mediaPanel.deleteEveryEpisodeOfName', {
                  name: condemned.name,
                })
              : condemned === null
                ? say('screens.adminArea.mediaPanel.deleteThisFile')
                : say('common.deleteName', { name: condemned.name })
          }
          detail={
            condemned?.isWholeSeries === true
              ? say('screens.adminArea.mediaPanel.everyEpisodesFileIsDeletedFrom')
              : say('screens.adminArea.mediaPanel.theFileIsDeletedFromThe')
          }
          confirmLabel={
            condemned?.isWholeSeries === true
              ? say('screens.adminArea.mediaPanel.deleteSeries')
              : say('screens.adminArea.mediaPanel.deleteFile')
          }
          isDestructive
          isBusy={isDeleting}
          onClose={() => {
            setCondemned(null);
          }}
          onConfirm={() => {
            if (condemned === null) {
              return;
            }

            setIsDeleting(true);

            void onDelete(condemned.item, condemned.isWholeSeries).then((isGone) => {
              setIsDeleting(false);

              if (isGone) {
                setCondemned(null);
              }
            });
          }}
        />
      )}
    </>
  );

  const titlePage =
    openedId === null ? null : opened === null ? (
      openTitle.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.mediaPanel.theTitleCouldNotBeRead')}
          why={openTitle.error.message}
          onTryAgain={() => {
            void openTitle.refetch();
          }}
          isTryingAgain={openTitle.isFetching}
        />
      ) : (
        <Spinner isCentered size="sm" label={say('common.loading')} />
      )
    ) : (
      <MediaTitlePage
        title={opened}
        library={tabs.find((one) => one.id === opened.libraryId) ?? null}
        actionsFor={actionsFor}
        place={opened.kind === 'film' || opened.kind === 'series' ? placeOf(opened) : null}
        paths={paths}
        onCorrect={onCorrect}
        {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
        {...(onOpenInCatalogue === undefined ? {} : { onOpenInCatalogue })}
        onBack={() => {
          setOpenedId(null);
        }}
        {...(before === undefined
          ? {}
          : {
              onPrevious: () => {
                setOpenedId(before.id, { ...NOWHERE, tab: place.tab });
              },
            })}
        {...(after === undefined
          ? {}
          : {
              onNext: () => {
                setOpenedId(after.id, { ...NOWHERE, tab: place.tab });
              },
            })}
        titlePlace={place}
        onTitlePlace={moveTo}
        libraries={libraries}
        mayManageFiles={mayManageFiles}
        {...(onFilesChanged === undefined ? {} : { onFilesChanged })}
        {...(onScan === undefined ? {} : { onScan })}
      />
    );

  return (
    <>
      {titlePage}
      <div
        className={openedId === null ? 'contents' : 'invisible h-0 overflow-hidden'}
        inert={openedId !== null}
      >
        <Tabs
          value={view}
          onValueChange={(next) => {
            const chosenView = MEDIA_VIEWS.find((one) => one === next);

            if (chosenView !== undefined) {
              (onView ?? setLocalView)(chosenView);
            }
          }}
        >
          <PanelCard
            title={say('common.media')}
            {...(freshness === undefined ? {} : { freshness })}
            isFlush
            below={
              <TabRow
                label={say('screens.adminArea.mediaPanel.howToShowTheMedia')}
                tone="underlined"
                size="sm"
                value={view}
                groups={[
                  {
                    items: [
                      { id: 'titles', label: say('screens.adminArea.cataloguePanel.titles') },
                      { id: 'folders', label: say('screens.adminArea.folderBrowser.folders') },
                    ],
                  },
                ]}
              />
            }
            actions={
              <>
                <ScopedField
                  label={
                    view === 'folders'
                      ? say('screens.adminArea.filesPanel.findAFileOrFolder')
                      : say('screens.adminArea.mediaPanel.findAProgrammeOrFilm')
                  }
                  isLabelHidden
                  placeholder={
                    view === 'folders'
                      ? folder === null
                        ? say('screens.adminArea.filesPanel.findInEveryLibrary')
                        : say('screens.adminArea.filesPanel.findInThisFolder')
                      : say('common.findATitle')
                  }
                  value={search}
                  onValueChange={setSearch}
                  choices={
                    tabs.length < 2 || view === 'folders'
                      ? []
                      : [
                          {
                            label: say('common.whichLibrary'),
                            options: librariesByPlace(tabs, faces.data ?? []).map((one) => {
                              const count = toFix.get(one.library.id) ?? 0;

                              return {
                                id: one.library.id,
                                label:
                                  count === 0
                                    ? one.library.name
                                    : sayCount(
                                        'screens.adminArea.mediaPanel.count.nameToFix',
                                        count,
                                        {
                                          name: one.library.name,
                                        },
                                      ),
                                group: one.group,
                              };
                            }),
                            value: libraryId,
                            onChange: setChosenLibrary,
                          },
                        ]
                  }
                  className="w-[28rem] max-w-full"
                />
                {view === 'titles' && asked.libraryId !== '' ? (
                  <ActionMenu
                    label={say('screens.adminArea.mediaPanel.moreForTheMedia')}
                    size="sm"
                    groups={[
                      {
                        items: [
                          {
                            id: 'words',
                            label: say('screens.adminArea.wordsManager.genresAndTags'),
                            onChoose: () => {
                              setIsManagingWords(true);
                            },
                          },
                          {
                            id: 'import',
                            label: say('screens.adminArea.importSheet.importASpreadsheet'),
                            onChoose: () => {
                              setIsImporting(true);
                            },
                          },
                          {
                            id: 'export',
                            label: say('screens.adminArea.mediaPanel.exportAsASpreadsheet'),
                            onChoose: () => {
                              window.location.assign(
                                `/api/admin/titles/export${searchOfTitleList(asked)}`,
                              );
                            },
                          },
                          ...(orphanCount === 0
                            ? []
                            : [
                                {
                                  id: 'orphans',
                                  label: sayCount(
                                    'screens.adminArea.mediaPanel.count.editsWithoutATitle',
                                    orphanCount,
                                  ),
                                  onChoose: () => {
                                    setIsSeeingOrphans(true);
                                  },
                                },
                              ]),
                        ],
                      },
                    ]}
                  />
                ) : null}
              </>
            }
          >
            <TabPanel value="folders" travel={travel}>
              <FolderView
                libraries={libraries}
                mayDelete={mayManageFiles}
                openAt={folder}
                search={search}
                onChanged={() => {
                  onFilesChanged?.();
                }}
                onScan={(scanned) => {
                  onScan?.(scanned);
                }}
                {...(onFolder === undefined ? {} : { onOpen: onFolder })}
                onOpenTitle={setOpenedId}
              />
            </TabPanel>

            <TabPanel value="titles" travel={travel}>
              <Tabs value={libraryId} onValueChange={setChosenLibrary}>
                {isUnreachable ? (
                  <p className="p-5 text-sm text-text-muted">
                    {say('screens.adminArea.mediaPanel.theLibrariesCouldNotBeRead')}
                  </p>
                ) : tabs.length === 0 && stillReading.libraries ? (
                  <Spinner isCentered label={say('common.readingTheLibraries')} size="sm" />
                ) : tabs.length === 0 ? (
                  <p className="p-5 text-sm text-text-muted">
                    {say('screens.adminArea.mediaPanel.thereIsNoLibraryYetAdd')}
                  </p>
                ) : (
                  <>
                    <ConfirmDialog
                      isOpen={pickedToDelete !== null}
                      isDestructive
                      title={sayCount(
                        'screens.adminArea.mediaPanel.count.deleteCountFiles',
                        pickedToDelete?.length ?? 0,
                      )}
                      detail={say('screens.adminArea.mediaPanel.theFilesAreDeletedFromTheDisk')}
                      confirmLabel={say('common.delete')}
                      onClose={() => {
                        setPickedToDelete(null);
                      }}
                      onConfirm={() => {
                        for (const file of pickedToDelete ?? []) {
                          void onDelete?.(file, false);
                        }

                        setPickedToDelete(null);
                        setPicked(new Set());
                      }}
                    />
                    <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-3">
                      {picked.size > 0 && !isShelf ? (
                        <SelectionBar
                          count={picked.size}
                          total={total}
                          onSelectAll={pickAll}
                          isSelectingAll={isPickingAll}
                          onClear={() => {
                            setPicked(new Set());
                          }}
                        >
                          {selectionActions}
                        </SelectionBar>
                      ) : (
                        <SegmentedRow
                          label={say('screens.adminArea.mediaPanel.whichTitles')}
                          size="sm"
                          tone="accent"
                          items={
                            isShelf
                              ? [
                                  {
                                    id: 'all',
                                    label: sayCount(
                                      'screens.adminArea.mediaPanel.count.allTitles',
                                      shelved.length,
                                    ),
                                  },
                                  {
                                    id: 'look',
                                    label: sayCount(
                                      'screens.adminArea.mediaPanel.count.noCover',
                                      looking,
                                    ),
                                  },
                                ]
                              : SHOWING.map((item) => ({
                                  id: item.id,
                                  label: item.label(counts?.[item.id] ?? 0),
                                }))
                          }
                          value={showing}
                          onSelect={(id) => {
                            const found = SHOWING.find((item) => item.id === id);

                            if (found !== undefined) {
                              setShowing(found.id);
                            }
                          }}
                        />
                      )}
                      {picked.size > 0 || isShelf ? null : listTools}
                    </div>
                    {isShelf || chosenFilters.size === 0 ? null : (
                      <div className="px-4 pb-2">
                        <AppliedFilters
                          groups={filterGroups}
                          selected={chosenFilters}
                          onRemove={(id) => {
                            setFilters(new Set([...chosenFilters].filter((one) => one !== id)));
                          }}
                          onClear={() => {
                            setFilters(new Set());
                          }}
                        />
                      </div>
                    )}
                    {tabs.map((library) => (
                      <TabPanel key={library.id} value={library.id} isInstant>
                        {(
                          library.kind === 'music'
                            ? stillReading.albums
                            : library.kind === 'books'
                              ? stillReading.books
                              : stillReading.files
                        ) ? (
                          <Spinner isCentered label={say('common.readingTheLibraries')} size="sm" />
                        ) : library.kind === 'music' || library.kind === 'books' ? (
                          <ShelfTable
                            label={say('screens.adminArea.mediaPanel.everythingInName', {
                              name: library.name,
                            })}
                            items={library.id === libraryId ? shelfShown : []}
                            emptyMessage={emptyMessage}
                            {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
                          />
                        ) : library.id === libraryId && pages.isPending ? (
                          <Spinner isCentered label={say('common.readingTheLibraries')} size="sm" />
                        ) : (
                          <DataTable
                            label={say('screens.adminArea.mediaPanel.everythingInName', {
                              name: library.name,
                            })}
                            columns={columns}
                            rows={library.id === libraryId ? [...shown] : [...NO_ROWS]}
                            totalRows={total}
                            hasMoreRows={pages.hasNextPage}
                            onReachEnd={() => {
                              if (!pages.isFetchingNextPage) {
                                void pages.fetchNextPage();
                              }
                            }}
                            sorting={{
                              id: list.sort,
                              isDescending: list.isDescending,
                            }}
                            onSortingChange={(sorting) => {
                              setList({
                                ...list,
                                sort: sortOfColumn(sorting?.id ?? ''),
                                isDescending: sorting?.isDescending ?? false,
                              });
                            }}
                            getRowId={(title) => title.id}
                            canOpen={(title) =>
                              title.parts.length > 0 ||
                              (title.row !== undefined &&
                                (title.row.kind === 'show' || title.row.versions > 0))
                            }
                            onChooseRow={openRow}
                            height="fills"
                            isVirtual
                            getSubRows={(title) =>
                              title.parts.length === 0 ? undefined : title.parts
                            }
                            emptyMessage={emptyMessage}
                          />
                        )}
                      </TabPanel>
                    ))}
                  </>
                )}
              </Tabs>
            </TabPanel>
          </PanelCard>
        </Tabs>
      </div>
      {dialogs}
    </>
  );
};

MediaPanel.displayName = 'MediaPanel';

export { MediaPanel };
