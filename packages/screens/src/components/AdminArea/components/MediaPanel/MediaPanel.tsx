import { Icon } from '@ValenceUI/Icon';
import {
  Bin as BinFilledIcon,
  Copy as CopyFilledIcon,
  EyeOff as EyeOffFilledIcon,
  Film as FilmFilledIcon,
  FolderArrowRight as FolderArrowRightFilledIcon,
  FolderOpen as FolderOpenIcon,
  Image as ImageFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
  Search as SearchFilledIcon,
  Subtitles as SubtitlesFilledIcon,
  Tape as TapeFilledIcon,
} from '@keyline-icons/react/fill';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { MediaPoster } from './components/MediaPoster/MediaPoster';
import { MediaTitlePage } from './components/MediaTitlePage/MediaTitlePage';
import { describeAudio } from './describeAudio';
import { describeNumber } from './describeNumber';
import { describeTitle } from './describeTitle';
import { filesOf } from './filesOf';
import { lengthOf } from './lengthOf';
import { sharedOf } from './sharedOf';
import { ShelfTable } from './components/ShelfTable/ShelfTable';
import { folderOf } from './folderOf';
import { gatherTitles } from './gatherTitles';
import { pathInLibrary } from '@ValenceScreens/components/AdminArea/pathInLibrary';
import { titleFolderOf } from './titleFolderOf';
import { bookFolderOf } from './bookFolderOf';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { MediaPanelProps, MediaView, MediaReading } from './MediaPanel.types';
import type { MediaTitle } from './MediaTitle.types';
import { describeTitleProblems } from './describeTitleProblems';
import type { TitleProblem } from './describeTitleProblems';
import type { ShelfItem } from './ShelfItem.types';
import { say } from '@ValenceI18n/say';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { sayCount } from '@ValenceI18n/sayCount';

const MEDIA_VIEWS = ['titles', 'folders'] as const;

const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const NO_PATHS: Readonly<Record<string, string>> = {};

const TAB_ORDER: readonly string[] = ['movies', 'shows', 'anime', 'music', 'books'];

const NO_ALBUMS: readonly MusicAlbum[] = [];

const NO_BOOKS: readonly Book[] = [];

const SHOWING = [
  { id: 'all', label: say('screens.adminArea.mediaPanel.allTitles') },
  { id: 'look', label: say('screens.adminArea.mediaPanel.unmatched') },
  { id: 'twice', label: say('screens.adminArea.mediaPanel.duplicates') },
  { id: 'unreadable', label: say('screens.adminArea.mediaPanel.unreadable') },
] as const;

const NO_IDS: ReadonlySet<string> = new Set();

const NOTHING_TO_READ: MediaReading = {
  libraries: false,
  files: false,
  albums: false,
  books: false,
};

/**
 * Whether a title, or any episode or version of it, is among some items.
 *
 * @param title - The title.
 * @param ids - The items.
 * @returns Whether any of it is.
 */
const holdsAnyOf = (title: MediaTitle, ids: ReadonlySet<string>): boolean =>
  ids.has(title.lead.id) ||
  title.episodes.some((episode) => ids.has(episode.id)) ||
  title.parts.some((part) => holdsAnyOf(part, ids));

const PROBLEM_NAMES: Readonly<Record<TitleProblem, string>> = {
  unmatched: say('screens.adminArea.mediaPanel.unmatched'),
  noPoster: say('screens.adminArea.mediaPanel.noPoster'),
  twice: say('screens.adminArea.mediaPanel.thereTwice'),
  unreadable: say('screens.adminArea.mediaPanel.couldNotBeRead'),
};

/**
 * Whether a title is missing something an administrator would want to put right: a match in the
 * catalogue, or a film's poster.
 *
 * @param title - The title.
 * @returns Whether it needs a look.
 */
const needsALook = (title: MediaTitle): boolean =>
  !title.isMatched || (title.kind === 'film' && title.posterFrom === null);

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
 * @param media - Every file the libraries hold.
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
  media,
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
  onView,
  folder = null,
  onFolder,
  mayManageFiles = false,
  onFilesChanged,
  onScan,
  onReencode,
  onShowCopies,
  onDelete,
  paths = NO_PATHS,
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
  const [chosenLibrary, setChosenLibrary] = useState<string | null>(null);
  const libraryId = tabs.some((library) => library.id === chosenLibrary)
    ? (chosenLibrary ?? '')
    : (tabs[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [showing, setShowing] = useState<string>('all');
  const narrowing = `${libraryId}\n${search}\n${showing}`;
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
  const openedId = onOpenTitle === undefined ? localOpenedId : openedTitle;
  const setOpenedId = onOpenTitle ?? setLocalOpenedId;
  const [isDeletingPicked, setIsDeletingPicked] = useState(false);
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaSummary | null>(null);
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

  const titles = useMemo(() => gatherTitles(media), [media]);
  const health = useQuery(adminQueries.libraryHealth());
  const twice = useMemo(
    () => new Set(health.data?.duplicate.items.map((item) => item.id) ?? NO_IDS),
    [health.data],
  );
  const unreadable = useMemo(
    () => new Set(health.data?.unreadable.items.map((item) => item.id) ?? NO_IDS),
    [health.data],
  );
  const isShowingTitle = useCallback(
    (title: MediaTitle, which: string) =>
      which === 'all' ||
      (which === 'look' && needsALook(title)) ||
      (which === 'twice' && holdsAnyOf(title, twice)) ||
      (which === 'unreadable' && holdsAnyOf(title, unreadable)),
    [twice, unreadable],
  );

  const inLibrary = useMemo(
    () => titles.filter((title) => title.libraryId === libraryId),
    [titles, libraryId],
  );

  const shown = useMemo(() => {
    const words = search.trim().toLowerCase();

    return inLibrary.filter(
      (title) =>
        isShowingTitle(title, showing) &&
        (words === '' || title.name.toLowerCase().includes(words)),
    );
  }, [inLibrary, search, showing, isShowingTitle]);

  const toFix = useMemo(() => {
    const counts = new Map<string, number>();

    for (const title of titles) {
      if (describeTitleProblems(title, health.data).problems.length > 0) {
        counts.set(title.libraryId, (counts.get(title.libraryId) ?? 0) + 1);
      }
    }

    return counts;
  }, [titles, health.data]);

  const lookingCount = inLibrary.filter(needsALook).length;
  const chosen = tabs.find((library) => library.id === libraryId) ?? null;
  const libraryPath = chosen?.path ?? null;
  const isShelf = chosen?.kind === 'music' || chosen?.kind === 'books';

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
                onChooseArtwork({
                  mediaId: title.lead.id,
                  name: title.name,
                  isSeries: title.kind === 'series',
                  mediaIds: title.episodes.map((episode) => episode.id),
                });
              },
            },
          ],
    [onChooseArtwork],
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
          ...artworkAction(title),
          ...(onReencode === undefined
            ? []
            : [
                {
                  id: 'reencode',
                  label: say('screens.adminArea.mediaPanel.reEncodeEveryEpisode'),
                  icon: <Icon of={TapeFilledIcon} size={15} />,
                  onChoose: () => {
                    onReencode(title.episodes);
                  },
                },
              ]),
        ],
        [
          ...moveItem(title.episodes, title.name),
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
    [artworkAction, leaveOutItems, moveItem, onCorrect, onDelete, onReencode, placeOf],
  );

  const actionsFor = useCallback(
    (title: MediaTitle): ActionMenuItem[][] => {
      switch (title.kind) {
        case 'series':
          return seriesActions(title);
        case 'episode':
          return fileActions(title.lead, title.name);
        case 'version':
          return fileActions(title.lead, `${title.lead.title}: ${title.name}`);
        case 'season':
          return onReencode === undefined
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
              ...artworkAction(title),
              ...(title.episodes.length > 1 ? moveItem(title.episodes, title.name) : []),
            ],
            ...fileActions(title.lead, title.name),
          ];
      }
    },
    [artworkAction, fileActions, moveItem, onCorrect, onReencode, seriesActions],
  );

  const pickedFiles = shown
    .filter((title) => picked.has(title.id))
    .flatMap((title) => filesOf(title));

  const columns = useMemo<DataTableColumn<MediaTitle>[]>(() => {
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
        cell: ({ row }) =>
          row.depth > 0 ? null : (
            <span
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Checkbox
                label={say('screens.adminArea.mediaPanel.selectName', { name: row.original.name })}
                isLabelHidden
                checked={picked.has(row.original.id)}
                onCheckedChange={(isChecked) => {
                  const next = new Set(picked);

                  if (isChecked) {
                    next.add(row.original.id);
                  } else {
                    next.delete(row.original.id);
                  }

                  setPicked(next);
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
          const problems = describeTitleProblems(title, health.data);

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

                {title.kind === 'series' || title.kind === 'season' || title.parts.length > 0 ? (
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
          const step = sharedOf(
            files.map((file) => sharpestStepOf(file)?.label ?? '—'),
            mixed,
          );
          const range = sharedOf(
            files.map((file) => describeRange(file.videoRange) ?? ''),
            mixed,
          );

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
          const codec = sharedOf(
            filesOf(row.original).map((file) => file.videoCodec.toUpperCase()),
            mixed,
          );

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
          const audio = sharedOf(filesOf(row.original).map(describeAudio), mixed);

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
            {formatDuration(lengthOf(row.original))}
          </span>
        ),
      },
      {
        id: 'size',
        header: say('common.size'),
        accessorFn: (title) => title.sizeBytes ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
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
  }, [actionsFor, health.data, picked, placeOf, setOpenedId, setPicked, shown]);

  const held = isShelf ? shelved.length : inLibrary.length;
  const looking = isShelf ? shelved.filter((item) => item.cover === null).length : lookingCount;
  const emptyMessage =
    held === 0
      ? say('screens.adminArea.mediaPanel.nothingHasBeenScannedIntoThis')
      : showing === 'look'
        ? isShelf
          ? say('screens.adminArea.mediaPanel.everythingHereHasACover')
          : say('screens.adminArea.mediaPanel.everythingHereIsMatchedAndHas')
        : say('common.nothingHereMatchesThat');

  const found = openedId === null ? null : (titles.find((one) => one.id === openedId) ?? null);
  const fetched = useQuery(
    adminQueries.titleFiles(
      found === null && openedId !== null && MEDIA_ID.test(openedId) ? openedId : null,
    ),
  );
  const opened =
    found ?? (fetched.data === undefined ? null : (gatherTitles(fetched.data)[0] ?? null));
  const inOrder = [...shown].sort((left, right) => left.order.localeCompare(right.order));
  const openedAt = opened === null ? -1 : inOrder.findIndex((one) => one.id === opened.id);
  const before = openedAt > 0 ? inOrder[openedAt - 1] : undefined;
  const after = openedAt >= 0 ? inOrder[openedAt + 1] : undefined;

  const dialogs = (
    <>
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

  if (opened !== null) {
    return (
      <>
        <MediaTitlePage
          title={opened}
          library={tabs.find((one) => one.id === opened.libraryId) ?? null}
          actionsFor={actionsFor}
          place={opened.kind === 'film' || opened.kind === 'series' ? placeOf(opened) : null}
          paths={paths}
          {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
          {...(onOpenInCatalogue === undefined ? {} : { onOpenInCatalogue })}
          onBack={() => {
            setOpenedId(null);
          }}
          {...(before === undefined
            ? {}
            : {
                onPrevious: () => {
                  setOpenedId(before.id);
                },
              })}
          {...(after === undefined
            ? {}
            : {
                onNext: () => {
                  setOpenedId(after.id);
                },
              })}
          {...(titlePlace === undefined ? {} : { titlePlace })}
          {...(onTitlePlace === undefined ? {} : { onTitlePlace })}
        />
        {dialogs}
      </>
    );
  }

  return (
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
          view === 'folders' ? null : (
            <>
              <ScopedField
                label={say('screens.adminArea.mediaPanel.findAProgrammeOrFilm')}
                isLabelHidden
                placeholder={say('common.findATitle')}
                value={search}
                onValueChange={setSearch}
                choices={
                  tabs.length < 2
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
            </>
          )
        }
      >
        <TabPanel value="folders" travel={travel}>
          <FolderView
            libraries={libraries}
            mayDelete={mayManageFiles}
            openAt={folder}
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
                  isOpen={isDeletingPicked}
                  isDestructive
                  title={sayCount(
                    'screens.adminArea.mediaPanel.count.deleteCountFiles',
                    pickedFiles.length,
                  )}
                  detail={say('screens.adminArea.mediaPanel.theFilesAreDeletedFromTheDisk')}
                  confirmLabel={say('common.delete')}
                  onClose={() => {
                    setIsDeletingPicked(false);
                  }}
                  onConfirm={() => {
                    setIsDeletingPicked(false);

                    for (const file of pickedFiles) {
                      void onDelete?.(file, false);
                    }

                    setPicked(new Set());
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-3">
                  <SegmentedRow
                    label={say('screens.adminArea.mediaPanel.whichTitles')}
                    size="sm"
                    tone="accent"
                    items={SHOWING.filter(
                      (item) => !isShelf || item.id === 'all' || item.id === 'look',
                    ).map((item) => ({
                      id: item.id,
                      label: `${item.id === 'look' && isShelf ? say('screens.adminArea.mediaPanel.noCover') : item.label} ${(item.id === 'all' ? (isShelf ? shelved.length : inLibrary.length) : item.id === 'look' ? looking : inLibrary.filter((title) => isShowingTitle(title, item.id)).length).toLocaleString()}`,
                    }))}
                    value={showing}
                    onSelect={(id) => {
                      const found = SHOWING.find((item) => item.id === id);

                      if (found !== undefined) {
                        setShowing(found.id);
                      }
                    }}
                  />

                  {picked.size === 0 ? null : (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-text-muted">
                        {sayCount('common.count.selected', picked.size)}
                      </span>
                      {onReencode === undefined ? null : (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => {
                            onReencode(pickedFiles);
                          }}
                        >
                          {say('screens.adminArea.mediaPanel.reEncodeSelected')}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          for (const file of pickedFiles) {
                            void rebuild(file);
                          }
                        }}
                      >
                        {say('screens.adminArea.mediaPanel.rebuildPreviews')}
                      </Button>
                      {onDelete === undefined ? null : (
                        <Button
                          variant="danger"
                          size="md"
                          onClick={() => {
                            setIsDeletingPicked(true);
                          }}
                        >
                          {say('common.delete')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          setPicked(new Set());
                        }}
                      >
                        {say('common.clear')}
                      </Button>
                    </span>
                  )}
                </div>
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
                    ) : (
                      <DataTable
                        label={say('screens.adminArea.mediaPanel.everythingInName', {
                          name: library.name,
                        })}
                        columns={columns}
                        rows={library.id === libraryId ? shown : []}
                        getRowId={(title) => title.id}
                        {...(onOpenFolder === undefined
                          ? {}
                          : {
                              expandsOnChoose: true,
                              onChooseRow: (title: MediaTitle) => {
                                const file = paths[title.lead.id];

                                if (title.parts.length === 0 && file !== undefined) {
                                  onOpenFolder(folderOf(file));
                                }
                              },
                            })}
                        pageSize={25}
                        height="fills"
                        getSubRows={(title) => (title.parts.length === 0 ? undefined : title.parts)}
                        emptyMessage={emptyMessage}
                      />
                    )}
                  </TabPanel>
                ))}
              </>
            )}
          </Tabs>
        </TabPanel>

        {dialogs}
      </PanelCard>
    </Tabs>
  );
};

MediaPanel.displayName = 'MediaPanel';

export { MediaPanel };
