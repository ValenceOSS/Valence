import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bin as BinFilledIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  File as FileIcon,
  FileArrowUp as FileArrowUpFilledIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenFilledIcon,
  FolderPlus as FolderPlusFilledIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Move as MoveFilledIcon,
  PenLine as PenLineFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
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
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfThrown } from '@ValenceScreens/admin/failureOf';
import { UploadMediaDialog } from '@ValenceScreens/components/AdminArea/components/UploadMediaDialog/UploadMediaDialog';
import { NameEntryDialog } from './components/NameEntryDialog/NameEntryDialog';
import { MoveEntryDialog } from './components/MoveEntryDialog/MoveEntryDialog';
import { trailInLibrary } from './trailInLibrary';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';
import type { FilesPanelProps } from './FilesPanel.types';
import { say } from '@ValenceI18n/say';

/**
 * The file manager: what is in each library's folders, as it sits on the disk, with everything an
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
 */
const FilesPanel = ({
  libraries,
  mayDelete,
  openAt = null,
  onChanged,
  onScan,
}: FilesPanelProps) => {
  const [at, setAt] = useState<string | null>(openAt);
  const [wasHanded, setWasHanded] = useState(openAt);
  const [typed, setTyped] = useState('');
  const words = useDeferredValue(typed.trim());
  const isSearching = words.length >= 2;
  const [renaming, setRenaming] = useState<LibraryEntry | null>(null);
  const [moving, setMoving] = useState<LibraryEntry | null>(null);
  const [condemned, setCondemned] = useState<LibraryEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNamingFolder, setIsNamingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cache = useQueryClient();

  const asked = useQuery(adminQueries.libraryFolder(at));
  const searched = useQuery({ ...adminQueries.libraryFileSearch(words, at), enabled: isSearching });

  const folder = asked.data ?? null;
  const library = libraries.find((one) => one.id === folder?.libraryId) ?? null;
  const status = asked.error instanceof RequestFailed ? asked.error.status : null;
  const rows = useMemo(
    () => (isSearching ? (searched.data?.entries ?? []) : (folder?.entries ?? [])),
    [isSearching, searched.data, folder],
  );
  const isInLibrary =
    at !== null && folder?.libraryPath !== null && folder?.libraryPath !== undefined;
  const inLibrary =
    folder?.libraryPath === null || folder?.libraryPath === undefined || folder.path === null
      ? ''
      : folder.path.slice(folder.libraryPath.length).replace(/^[\\/]+/, '');

  const open = (path: string | null) => {
    setTyped('');
    setAt(path);
  };

  if (wasHanded !== openAt) {
    setWasHanded(openAt);

    if (openAt !== null) {
      open(openAt);
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

  const columns = useMemo<DataTableColumn<LibraryEntry>[]>(
    () => [
      {
        id: 'name',
        header: say('common.name'),
        accessorFn: (entry) => entry.name,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <Icon of={row.original.isFolder ? FolderIcon : FileIcon} size={16} tone="muted" />

            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-text">{row.original.name}</span>

              {isSearching ? (
                <span className="truncate font-body text-xs text-text-muted">
                  {row.original.path}
                </span>
              ) : null}
            </span>
          </span>
        ),
      },
      {
        id: 'size',
        header: say('common.size'),
        accessorFn: (entry) => entry.sizeBytes ?? -1,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'modified',
        header: say('screens.adminArea.filesPanel.changed'),
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
        id: 'catalogue',
        header: say('common.valence'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.mediaId === null ? null : (
            <Badge size="sm" tone="success">
              {say('screens.adminArea.filesPanel.inTheCatalogue')}
            </Badge>
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
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
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
                          setMoving(row.original);
                        },
                      },
                    ],
                  },
                  ...(mayDelete
                    ? [
                        {
                          items: [
                            {
                              id: 'delete',
                              label: say('screens.adminArea.filesPanel.delete'),
                              icon: <Icon of={BinFilledIcon} size={15} />,
                              isDestructive: true,
                              onChoose: () => {
                                setCondemned(row.original);
                              },
                            },
                          ],
                        },
                      ]
                    : []),
                ]}
              />
            </span>
          ),
      },
    ],
    [at, isSearching, mayDelete],
  );

  return (
    <PanelCard
      title={say('common.files')}
      isFlush
      actions={
        <TextField
          label={say('screens.adminArea.filesPanel.findAFileOrFolder')}
          isLabelHidden
          size="sm"
          type="search"
          placeholder={
            at === null
              ? say('screens.adminArea.filesPanel.findInEveryLibrary')
              : say('screens.adminArea.filesPanel.findInThisFolder')
          }
          value={typed}
          onValueChange={setTyped}
          className="w-64 max-w-full"
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--surface-line)] px-4 py-2.5">
        <Button
          isIconOnly
          variant="secondary"
          size="xs"
          label={say('common.upAFolder')}
          disabled={at === null}
          onClick={() => {
            open(folder?.parent ?? null);
          }}
        >
          <Icon of={ChevronUpIcon} size={14} />
        </Button>

        <nav
          aria-label={say('common.whereYouAre')}
          className="valence-rail flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
        >
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              open(null);
            }}
          >
            {say('common.libraries')}
          </Button>

          {at === null || folder?.path === null || folder?.path === undefined || library === null
            ? null
            : trailInLibrary(folder.path, library.path, library.name).map((segment) => (
                <span key={segment.path} className="flex shrink-0 items-center gap-0.5">
                  <Icon of={ChevronRightIcon} size={12} tone="muted" />

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      open(segment.path);
                    }}
                  >
                    {segment.label}
                  </Button>
                </span>
              ))}
        </nav>

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
        <DataTable
          height="fills"
          label={isSearching ? say('screens.adminArea.filesPanel.filesFound') : say('common.files')}
          columns={columns}
          rows={rows}
          pageSize={50}
          getRowId={(entry) => entry.path}
          onChooseRow={(entry) => {
            if (entry.isFolder) {
              open(entry.path);
            }
          }}
          emptyMessage={
            isSearching
              ? say('screens.adminArea.filesPanel.nothingHereIsCalledThat')
              : at === null
                ? say('common.thereAreNoLibrariesYet')
                : say('screens.adminArea.filesPanel.thisFolderIsEmpty')
          }
        />
      )}

      {(isSearching ? searched.data?.isTruncated : folder?.isTruncated) === true ? (
        <p className="px-5 pb-4 text-xs text-text-muted">
          {isSearching
            ? say('screens.adminArea.filesPanel.showingTheNearestMatchesOpenA')
            : say('screens.adminArea.filesPanel.showingTheFirst2000Things')}
        </p>
      ) : null}

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
        entry={moving}
        start={at ?? ''}
        onClose={() => {
          setMoving(null);
        }}
        onMove={(into) => {
          if (moving === null) {
            return;
          }

          void change(
            moving,
            { kind: 'move', into },
            say('screens.adminArea.filesPanel.movedName', { name: moving.name }),
          ).then((failure) => {
            if (failure === null) {
              setMoving(null);
            }
          });
        }}
      />

      <ConfirmDialog
        isOpen={condemned !== null}
        title={
          condemned === null
            ? say('screens.adminArea.filesPanel.deleteThis')
            : say('common.deleteName', { name: condemned.name })
        }
        detail={
          condemned?.isFolder === true
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

          void change(
            condemned,
            { kind: 'delete' },
            say('common.deletedName', { name: condemned.name }),
          ).then((failure) => {
            setIsDeleting(false);

            if (failure === null) {
              setCondemned(null);
            }
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
    </PanelCard>
  );
};

FilesPanel.displayName = 'FilesPanel';

export { FilesPanel };
