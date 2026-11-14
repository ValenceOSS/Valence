import { SelectionBar } from '@ValenceUI/SelectionBar';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinFilledIcon,
  ChevronUp as ChevronUpIcon,
  EyeOff as EyeOffFilledIcon,
  File as FileIcon,
  FileArrowUp as FileArrowUpFilledIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenFilledIcon,
  FolderPlus as FolderPlusFilledIcon,
  Move as MoveFilledIcon,
  PenLine as PenLineFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Breadcrumbs } from '@ValenceUI/Breadcrumbs';
import { Button } from '@ValenceUI/Button';
import { OriginBadge } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/OriginBadge/OriginBadge';
import { FILE_STATUS_LOOKS } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/FolderView/FILE_STATUS_LOOKS';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { createFolder } from '@ValenceClient/admin/createFolder';
import { changeLibraryFile } from '@ValenceClient/admin/changeLibraryFile';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { LeaveOutDialog } from '@ValenceScreens/components/AdminArea/components/LeaveOutDialog/LeaveOutDialog';
import type { LeaveOutTarget } from '@ValenceScreens/components/AdminArea/components/LeaveOutDialog/LeaveOutDialog.types';
import { libraryHolding } from './libraryHolding';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfThrown } from '@ValenceScreens/admin/failureOf';
import { UploadMediaDialog } from '@ValenceScreens/components/AdminArea/components/UploadMediaDialog/UploadMediaDialog';
import { NameEntryDialog } from './components/NameEntryDialog/NameEntryDialog';
import { MoveEntryDialog } from './components/MoveEntryDialog/MoveEntryDialog';
import { FileDetails } from './components/FileDetails/FileDetails';
import { trailInLibrary } from './trailInLibrary';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';
import type { FolderViewProps } from './FolderView.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const NO_COLUMNS: readonly DataTableColumn<LibraryEntry>[] = [];

/**
 * Media's folder view, the file manager: what is in each library's folders, as it sits on the disk, with everything an
 * administrator does to files without a terminal — find something by name, open a folder, rename,
 * move or delete what is there, make a folder, and upload into the one being looked at.
 *
 * It starts at the libraries and never leaves them; the server refuses anything outside one, and a
 * library's own folder cannot be renamed, moved or deleted here. Whatever changes, the libraries it
 * touched are scanned, so the catalogue follows the disk without a second gesture. A file Valence
 * has in its catalogue says so, since those are the ones a change is felt by.
 *
 * @param libraries - The libraries there are, for knowing which one a folder is in.
 * @param mayDelete - Whether the one looking may delete media, which decides whether Delete is offered.
 * @param openAt - A folder to open, handed in from elsewhere; a new one opens it, and nothing leaves
 *   whatever folder is open alone.
 * @param onChanged - Told that something on the disk changed, so what depends on the catalogue can
 *   be read again.
 * @param onScan - Asked to scan a library once something is uploaded into it.
 * @param onOpen - Told which folder is open, or nothing for the libraries, so the address can keep it.
 * @param onOpenTitle - Opens the title a file or folder belongs to, by its id in Media.
 * @param root - The highest folder it shows, such as a library's or a title's own, where it may not
 *   go above one.
 * @param search - What to search for, where the search box is somebody else's.
 * @param keeps - Which entries to show, where only some of a folder belong here.
 * @param columns - More columns to show after each entry's name, such as a video's quality.
 * @param actionsOf - More of what can be done to an entry, offered in its menu.
 * @param hidesTitles - Whether to leave out the title column, where every entry is the same title's.
 */
const FolderView = ({
  libraries,
  mayDelete,
  openAt = null,
  onChanged,
  onScan,
  onOpen,
  onOpenTitle,
  root = null,
  search,
  keeps,
  columns: moreColumns = NO_COLUMNS,
  actionsOf,
  hidesTitles = false,
}: FolderViewProps) => {
  const [at, setAt] = useState<string | null>(openAt ?? root);
  const [wasHanded, setWasHanded] = useState(openAt);
  const [ownTyped, setTyped] = useState('');
  const typed = search ?? ownTyped;
  const words = useDeferredValue(typed.trim());
  const isSearching = words.length >= 2;
  const [renaming, setRenaming] = useState<LibraryEntry | null>(null);
  const [moving, setMoving] = useState<readonly LibraryEntry[] | null>(null);
  const [condemned, setCondemned] = useState<readonly LibraryEntry[] | null>(null);
  const [chosenPaths, setChosenPaths] = useState<ReadonlySet<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNamingFolder, setIsNamingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [leaving, setLeaving] = useState<LeaveOutTarget | null>(null);
  const [isOnlyOrphans, setIsOnlyOrphans] = useState(false);
  const cache = useQueryClient();

  const asked = useQuery(adminQueries.libraryFolder(at));
  const searched = useQuery({ ...adminQueries.libraryFileSearch(words, at), enabled: isSearching });

  const folder = asked.data ?? null;
  const library = libraries.find((one) => one.id === folder?.libraryId) ?? null;
  const status = asked.error instanceof RequestFailed ? asked.error.status : null;
  const listed = useMemo(
    () =>
      (isSearching ? (searched.data?.entries ?? []) : (folder?.entries ?? [])).filter(
        (entry) => keeps === undefined || keeps(entry),
      ),
    [isSearching, searched.data, folder, keeps],
  );
  const orphanCount = listed.filter((entry) => entry.status === 'orphaned').length;
  const rows = isOnlyOrphans ? listed.filter((entry) => entry.status === 'orphaned') : listed;
  const isAtRoot = at === null || (root !== null && at === root);
  const isInLibrary =
    at !== null && folder?.libraryPath !== null && folder?.libraryPath !== undefined;
  const inLibrary =
    folder?.libraryPath === null || folder?.libraryPath === undefined || folder.path === null
      ? ''
      : folder.path.slice(folder.libraryPath.length).replace(/^[\\/]+/, '');

  const chosen = rows.filter((entry) => chosenPaths.has(entry.path));

  const show = useCallback((path: string | null) => {
    setTyped('');
    setChosenPaths(new Set());
    setAt(path);
  }, []);

  const open = useCallback(
    (path: string | null) => {
      show(path);
      onOpen?.(path);
    },
    [show, onOpen],
  );

  const shownPath = (path: string): string => {
    const holding = libraryHolding(path, libraries);

    return holding === null
      ? path
      : `${holding.name}/${path.slice(holding.path.length).replace(/^[\\/]+/, '')}`;
  };

  if (wasHanded !== openAt) {
    setWasHanded(openAt);

    if (openAt !== null || root !== null) {
      show(openAt ?? root);
    }
  }

  const refresh = async () => {
    await cache.invalidateQueries({
      queryKey: adminQueries.libraryFolder(null).queryKey.slice(0, -1),
    });
    onChanged();
  };

  const change = async (
    entry: LibraryEntry,
    what: Parameters<typeof changeLibraryFile>[1],
    done: string,
  ): Promise<string | null> => {
    const failure = await failureOfThrown(() => changeLibraryFile(entry.path, what));

    tellOutcome(done, failure);

    if (failure === null) {
      await refresh();
    }

    return failure;
  };

  const changeEach = async (
    entries: readonly LibraryEntry[],
    what: Parameters<typeof changeLibraryFile>[1],
    done: (name: string) => string,
  ): Promise<readonly LibraryEntry[]> => {
    const landed: LibraryEntry[] = [];
    let failure: string | null = null;

    for (const entry of entries) {
      failure = await failureOfThrown(() => changeLibraryFile(entry.path, what));

      if (failure !== null) {
        break;
      }

      landed.push(entry);
    }

    const said = done(
      landed.length === 1 ? (landed[0]?.name ?? '') : sayCount('common.count.items', landed.length),
    );

    if (failure !== null && landed.length > 0) {
      tellOutcome(said, null);
    }

    tellOutcome(said, failure);

    if (landed.length > 0) {
      await refresh();
    }

    return entries.filter((entry) => !landed.includes(entry));
  };

  const leaveOutItemsFor = useCallback(
    (entry: LibraryEntry) => {
      const holding = libraryHolding(entry.path, libraries);

      return holding === null
        ? []
        : [
            {
              id: 'leave-out',
              label: say('common.leaveOutOfTheLibrary'),
              icon: <Icon of={EyeOffFilledIcon} size={15} />,
              onChoose: () => {
                setLeaving({
                  libraryId: holding.id,
                  libraryPath: holding.path,
                  path: entry.path,
                  name: entry.name,
                  isFolder: entry.isFolder,
                });
              },
            },
          ];
    },
    [libraries],
  );

  const columns = useMemo<DataTableColumn<LibraryEntry>[]>(
    () => [
      {
        id: 'choose',
        header: () => (
          <Checkbox
            label={say('screens.adminArea.filesPanel.chooseEverythingHere')}
            isLabelHidden
            checked={rows.length > 0 && rows.every((entry) => chosenPaths.has(entry.path))}
            isMixed={
              rows.some((entry) => chosenPaths.has(entry.path)) &&
              !rows.every((entry) => chosenPaths.has(entry.path))
            }
            onCheckedChange={(isChecked) => {
              setChosenPaths(new Set(isChecked ? rows.map((entry) => entry.path) : []));
            }}
          />
        ),
        enableSorting: false,
        meta: { shrinks: true },
        cell: ({ row }) => (
          <span
            className="flex items-center"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Checkbox
              label={say('screens.adminArea.filesPanel.chooseName', { name: row.original.name })}
              isLabelHidden
              checked={chosenPaths.has(row.original.path)}
              onCheckedChange={(isChecked) => {
                setChosenPaths((was) => {
                  const next = new Set(was);

                  if (isChecked) {
                    next.add(row.original.path);
                  } else {
                    next.delete(row.original.path);
                  }

                  return next;
                });
              }}
            />
          </span>
        ),
      },
      {
        id: 'name',
        header: say('common.name'),
        accessorFn: (entry) => entry.name,
        meta: { fills: true },
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <Icon
              of={row.original.isFolder ? FolderIcon : FileIcon}
              size={16}
              tone="muted"
              className="shrink-0"
            />

            <span className="flex min-w-0 flex-col">
              {row.original.isFolder ? (
                <Button
                  variant="subtle"
                  size="none"
                  className="block max-w-full self-start truncate text-start font-medium text-text hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    open(row.original.path);
                  }}
                >
                  {row.original.name}
                </Button>
              ) : (
                <span className="truncate font-medium text-text">{row.original.name}</span>
              )}

              {isSearching ? (
                <span className="truncate font-body text-xs text-text-muted">
                  {row.original.path}
                </span>
              ) : null}
            </span>
          </span>
        ),
      },
      ...(hidesTitles
        ? []
        : ([
            {
              id: 'title',
              header: say('common.title'),
              meta: { hidesOnPhones: true },
              enableSorting: false,
              cell: ({ row }) => {
                const { title, titleId } = row.original;

                return title === null || title === undefined ? (
                  <span className="text-text-muted">—</span>
                ) : titleId === null || titleId === undefined || onOpenTitle === undefined ? (
                  <span className="block max-w-56 truncate text-text">{title}</span>
                ) : (
                  <Button
                    variant="subtle"
                    size="none"
                    label={say('common.openTitle', { title })}
                    className="max-w-56 justify-start underline-offset-4 hover:underline"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenTitle(titleId);
                    }}
                  >
                    <span className="truncate">{title}</span>
                  </Button>
                );
              },
            },
          ] satisfies DataTableColumn<LibraryEntry>[])),
      {
        id: 'status',
        header: say('common.status'),
        enableSorting: false,
        cell: ({ row }) => {
          const { status } = row.original;

          return status === null || status === undefined ? null : (
            <Badge size="sm" tone={FILE_STATUS_LOOKS[status].tone}>
              {FILE_STATUS_LOOKS[status].label}
            </Badge>
          );
        },
      },
      {
        id: 'origin',
        header: say('screens.adminArea.folderView.from'),
        meta: { showsOnlyWhenWide: true },
        enableSorting: false,
        cell: ({ row }) => {
          const { origin } = row.original;

          return origin === null || origin === undefined ? null : <OriginBadge origin={origin} />;
        },
      },
      ...moreColumns,
      {
        id: 'size',
        header: say('common.size'),
        meta: { hidesOnPhones: true },
        accessorFn: (entry) => entry.sizeBytes ?? -1,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'modified',
        header: say('screens.adminArea.filesPanel.changed'),
        meta: { hidesOnPhones: true },
        accessorFn: (entry) => entry.modifiedAt ?? '',
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {row.original.modifiedAt === null
              ? '—'
              : new Date(row.original.modifiedAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          at === null && !isSearching ? null : (
            <span className="flex justify-end">
              <ActionMenu
                label={say('common.actionsForName', { name: row.original.name })}
                groups={[
                  {
                    items: [
                      ...(row.original.isFolder
                        ? [
                            {
                              id: 'open',
                              label: say('common.open'),
                              icon: <Icon of={FolderOpenFilledIcon} size={15} />,
                              onChoose: () => {
                                open(row.original.path);
                              },
                            },
                          ]
                        : []),
                      {
                        id: 'rename',
                        label: say('screens.adminArea.filesPanel.rename'),
                        icon: <Icon of={PenLineFilledIcon} size={15} />,
                        onChoose: () => {
                          setRenaming(row.original);
                        },
                      },
                      {
                        id: 'move',
                        label: say('screens.adminArea.filesPanel.move'),
                        icon: <Icon of={MoveFilledIcon} size={15} />,
                        onChoose: () => {
                          setMoving([row.original]);
                        },
                      },
                    ],
                  },
                  ...(actionsOf?.(row.original) ?? []).map((items) => ({ items })),
                  {
                    items: [
                      ...leaveOutItemsFor(row.original),
                      ...(mayDelete
                        ? [
                            {
                              id: 'delete',
                              label: say('screens.adminArea.filesPanel.delete'),
                              icon: <Icon of={BinFilledIcon} size={15} />,
                              isDestructive: true,
                              onChoose: () => {
                                setCondemned([row.original]);
                              },
                            },
                          ]
                        : []),
                    ],
                  },
                ].filter((group) => group.items.length > 0)}
              />
            </span>
          ),
      },
    ],
    [
      actionsOf,
      at,
      chosenPaths,
      hidesTitles,
      isSearching,
      leaveOutItemsFor,
      mayDelete,
      moreColumns,
      onOpenTitle,
      open,
      rows,
    ],
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--surface-line)] px-4 py-2.5">
        <Button
          isIconOnly
          variant="secondary"
          size="xs"
          label={say('common.upAFolder')}
          disabled={isAtRoot}
          onClick={() => {
            open(folder?.parent ?? null);
          }}
        >
          <Icon of={ChevronUpIcon} size={14} />
        </Button>

        <Breadcrumbs
          label={say('common.whereYouAre')}
          crumbs={[
            ...(root === null ? [{ id: '', label: say('common.libraries') }] : []),
            ...(at === null ||
            folder?.path === null ||
            folder?.path === undefined ||
            library === null
              ? []
              : trailInLibrary(folder.path, library.path, library.name)
                  .filter(
                    (segment) =>
                      root === null || segment.path === root || segment.path.startsWith(`${root}/`),
                  )
                  .map((segment) => ({ id: segment.path, label: segment.label }))),
          ]}
          onChoose={(id) => {
            open(id === '' ? null : id);
          }}
          className="min-w-0 flex-1 max-sm:basis-[calc(100%-2.5rem)]"
        />

        {orphanCount > 0 || isOnlyOrphans ? (
          <Button
            variant="secondary"
            size="xs"
            isActive={isOnlyOrphans}
            onClick={() => {
              setIsOnlyOrphans(!isOnlyOrphans);
            }}
          >
            {sayCount('screens.adminArea.filesPanel.count.orphanedFiles', orphanCount)}
          </Button>
        ) : null}

        {chosen.length > 1 && (at !== null || isSearching) ? (
          <SelectionBar
            count={chosen.length}
            onClear={() => {
              setChosenPaths(new Set());
            }}
            className="shrink-0"
          >
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setMoving(chosen);
              }}
            >
              <Icon of={MoveFilledIcon} size={14} />
              {say('screens.adminArea.filesPanel.move')}
            </Button>

            {mayDelete ? (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setCondemned(chosen);
                }}
              >
                <Icon of={BinFilledIcon} size={14} />
                {say('screens.adminArea.filesPanel.delete')}
              </Button>
            ) : null}
          </SelectionBar>
        ) : null}

        {isInLibrary ? (
          <span className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setIsNamingFolder(true);
              }}
            >
              <Icon of={FolderPlusFilledIcon} size={14} />
              {say('common.newFolder')}
            </Button>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setIsUploading(true);
              }}
            >
              <Icon of={FileArrowUpFilledIcon} size={14} />
              {say('screens.adminArea.filesPanel.uploadHere')}
            </Button>
          </span>
        ) : null}

        {search === undefined ? (
          <TextField
            label={say('screens.adminArea.filesPanel.findAFileOrFolder')}
            isLabelHidden
            type="search"
            size="sm"
            placeholder={
              at === null
                ? say('screens.adminArea.filesPanel.findInEveryLibrary')
                : say('screens.adminArea.filesPanel.findInThisFolder')
            }
            value={typed}
            onValueChange={setTyped}
            className="w-64 max-w-full"
          />
        ) : null}
      </div>

      {(isSearching ? searched.isPending : asked.isPending) ? (
        <Spinner
          isCentered
          size="sm"
          label={
            isSearching
              ? say('screens.adminArea.filesPanel.lookingForFiles')
              : say('screens.adminArea.filesPanel.readingTheFolder')
          }
        />
      ) : !isSearching && status === 404 ? (
        <p className="p-5 text-sm text-text-muted">
          {say('screens.adminArea.filesPanel.thatFolderIsNotThereAny')}
        </p>
      ) : !isSearching && status === 403 ? (
        <p className="p-5 text-sm text-text-muted">
          {say('error.common.valenceIsNotAllowedToRead')}
        </p>
      ) : (isSearching ? searched.isError : asked.isError) ? (
        <CouldNotRead
          said={
            isSearching
              ? say('common.theSearchCouldNotBeRead')
              : say('screens.adminArea.filesPanel.theFolderCouldNotBeRead')
          }
          isTryingAgain={isSearching ? searched.isFetching : asked.isFetching}
          onTryAgain={() => {
            void (isSearching ? searched.refetch() : asked.refetch());
          }}
        />
      ) : (
        <div className="flex min-h-0 flex-1 max-lg:flex-col">
          <div className="min-h-0 min-w-0 flex-1">
            <DataTable
              height="fills"
              label={
                isSearching ? say('screens.adminArea.filesPanel.filesFound') : say('common.files')
              }
              columns={
                at === null
                  ? columns.filter(
                      (column) =>
                        !['choose', 'size', 'modified', 'title', 'status', 'origin'].includes(
                          column.id ?? '',
                        ),
                    )
                  : columns
              }
              rows={rows}
              pageSize={50}
              getRowId={(entry) => entry.path}
              onChooseRow={(entry) => {
                setChosenPaths(
                  chosenPaths.size === 1 && chosenPaths.has(entry.path)
                    ? new Set()
                    : new Set([entry.path]),
                );
              }}
              emptyMessage={
                isSearching
                  ? say('screens.adminArea.filesPanel.nothingHereIsCalledThat')
                  : at === null
                    ? say('common.thereAreNoLibrariesYet')
                    : say('screens.adminArea.filesPanel.thisFolderIsEmpty')
              }
            />
          </div>

          <FileDetails
            where={
              isSearching
                ? null
                : {
                    name:
                      at === null || folder?.path === null || folder?.path === undefined
                        ? say('common.libraries')
                        : library !== null && folder.path === library.path
                          ? library.name
                          : (folder.path.split(/[\\/]/).at(-1) ?? folder.path),
                    path: at === null ? null : (folder?.path ?? null),
                    holds: rows.length,
                  }
            }
            selected={chosen}
            {...(onOpenTitle === undefined ? {} : { onOpenTitle })}
            shownPath={shownPath}
            onClear={() => {
              setChosenPaths(new Set());
            }}
          />
        </div>
      )}

      {(isSearching ? searched.data?.isTruncated : folder?.isTruncated) === true ? (
        <p className="px-5 pb-4 text-xs text-text-muted">
          {isSearching
            ? say('screens.adminArea.filesPanel.showingTheNearestMatchesOpenA')
            : say('screens.adminArea.filesPanel.showingTheFirst2000Things')}
        </p>
      ) : null}

      <LeaveOutDialog
        target={leaving}
        onClose={() => {
          setLeaving(null);
        }}
      />

      <NameEntryDialog
        key={`rename-${renaming?.path ?? 'none'}`}
        isOpen={renaming !== null}
        title={
          renaming === null
            ? say('common.rename')
            : say('common.renameName', { name: renaming.name })
        }
        initialName={renaming?.name ?? ''}
        confirmLabel={say('common.rename')}
        onClose={() => {
          setRenaming(null);
        }}
        onName={async (name) => {
          if (renaming === null) {
            return null;
          }

          const failure = await change(
            renaming,
            { kind: 'rename', name },
            say('screens.adminArea.filesPanel.renamedToName', { name }),
          );

          if (failure === null) {
            setRenaming(null);
          }

          return failure;
        }}
      />

      <NameEntryDialog
        key={`folder-${isNamingFolder.toString()}`}
        isOpen={isNamingFolder}
        title={say('common.newFolder')}
        initialName=""
        confirmLabel={say('common.create')}
        onClose={() => {
          setIsNamingFolder(false);
        }}
        onName={async (name) => {
          if (at === null) {
            return null;
          }

          const failure = await failureOfThrown(() => createFolder(at, name));

          tellOutcome(say('screens.adminArea.filesPanel.madeTheFolderName', { name }), failure);

          if (failure === null) {
            setIsNamingFolder(false);
            await refresh();
          }

          return failure;
        }}
      />

      <MoveEntryDialog
        name={
          moving === null
            ? null
            : moving.length === 1
              ? (moving[0]?.name ?? '')
              : sayCount('common.count.items', moving.length)
        }
        start={at ?? ''}
        onClose={() => {
          setMoving(null);
        }}
        onMove={(into) => {
          if (moving === null) {
            return;
          }

          void changeEach(moving, { kind: 'move', into }, (name) =>
            say('screens.adminArea.filesPanel.movedName', { name }),
          ).then((left) => {
            setMoving(left.length === 0 ? null : left);
            setChosenPaths(new Set(left.map((entry) => entry.path)));
          });
        }}
      />

      <ConfirmDialog
        isOpen={condemned !== null}
        title={
          condemned === null
            ? say('screens.adminArea.filesPanel.deleteThis')
            : say('common.deleteName', {
                name:
                  condemned.length === 1
                    ? (condemned[0]?.name ?? '')
                    : sayCount('common.count.items', condemned.length),
              })
        }
        detail={
          condemned?.some((entry) => entry.isFolder) === true
            ? say('screens.adminArea.filesPanel.theFolderIsDeletedFromThe')
            : say('screens.adminArea.filesPanel.theFileIsDeletedFromThe')
        }
        confirmLabel={say('common.delete')}
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

          void changeEach(condemned, { kind: 'delete' }, (name) =>
            say('common.deletedName', { name }),
          ).then((left) => {
            setIsDeleting(false);
            setCondemned(left.length === 0 ? null : left);
            setChosenPaths(new Set(left.map((entry) => entry.path)));
          });
        }}
      />

      <UploadMediaDialog
        library={isUploading ? library : null}
        folder={inLibrary}
        onClose={() => {
          setIsUploading(false);
        }}
        onUploaded={(uploaded) => {
          onScan(uploaded.id);
          void refresh();
        }}
      />
    </div>
  );
};

FolderView.displayName = 'FolderView';

export { FolderView };
