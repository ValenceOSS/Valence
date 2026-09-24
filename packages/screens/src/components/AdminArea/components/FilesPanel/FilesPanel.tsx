import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  File as FileIcon,
  Folder as FolderIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Search as SearchIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  FileArrowUp as FileArrowUpFilledIcon,
  FolderOpen as FolderOpenFilledIcon,
  FolderPlus as FolderPlusFilledIcon,
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
 * @param onChanged - Told that something on the disk changed, so what depends on the catalogue can
 *   be read again.
 * @param onScan - Asked to scan a library once something is uploaded into it.
 */
const FilesPanel = ({ libraries, mayDelete, onChanged, onScan }: FilesPanelProps) => {
  const [at, setAt] = useState<string | null>(null);
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
        header: 'Name',
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
        header: 'Size',
        accessorFn: (entry) => entry.sizeBytes ?? -1,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'modified',
        header: 'Changed',
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
        header: 'Valence',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.mediaId === null ? null : (
            <Badge size="sm" tone="success">
              In the catalogue
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
                label={`Actions for ${row.original.name}`}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      ...(row.original.isFolder
                        ? [
                            {
                              id: 'open',
                              label: 'Open',
                              icon: <Icon of={FolderOpenFilledIcon} size={15} />,
                              onChoose: () => {
                                open(row.original.path);
                              },
                            },
                          ]
                        : []),
                      {
                        id: 'rename',
                        label: 'Rename…',
                        icon: <Icon of={PenLineFilledIcon} size={15} />,
                        onChoose: () => {
                          setRenaming(row.original);
                        },
                      },
                      {
                        id: 'move',
                        label: 'Move…',
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
                              label: 'Delete…',
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
      title="Files"
      isFlush
      actions={
        <TextField
          label="Find a file or folder"
          isLabelHidden
          size="sm"
          type="search"
          placeholder={at === null ? 'Find in every library' : 'Find in this folder'}
          value={typed}
          onValueChange={setTyped}
          icon={<Icon of={SearchIcon} size={14} />}
          className="w-64 max-w-full"
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--surface-line)] px-4 py-2.5">
        <Button
          isIconOnly
          variant="secondary"
          size="xs"
          label="Up a folder"
          disabled={at === null}
          onClick={() => {
            open(folder?.parent ?? null);
          }}
        >
          <Icon of={ChevronUpIcon} size={14} />
        </Button>

        <nav
          aria-label="Where you are"
          className="valence-rail flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
        >
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              open(null);
            }}
          >
            Libraries
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
              New folder
            </Button>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setIsUploading(true);
              }}
            >
              <Icon of={FileArrowUpFilledIcon} size={14} />
              Upload here
            </Button>
          </span>
        ) : null}
      </div>

      {(isSearching ? searched.isPending : asked.isPending) ? (
        <Spinner
          isCentered
          size="sm"
          label={isSearching ? 'Looking for files' : 'Reading the folder'}
        />
      ) : !isSearching && status === 404 ? (
        <p className="p-5 text-sm text-text-muted">That folder is not there any more.</p>
      ) : !isSearching && status === 403 ? (
        <p className="p-5 text-sm text-text-muted">Valence is not allowed to read that folder.</p>
      ) : (isSearching ? searched.isError : asked.isError) ? (
        <CouldNotRead
          what={isSearching ? 'The search' : 'The folder'}
          isTryingAgain={isSearching ? searched.isFetching : asked.isFetching}
          onTryAgain={() => {
            void (isSearching ? searched.refetch() : asked.refetch());
          }}
        />
      ) : (
        <DataTable
          label={isSearching ? 'Files found' : 'Files'}
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
              ? 'Nothing here is called that.'
              : at === null
                ? 'There are no libraries yet.'
                : 'This folder is empty.'
          }
        />
      )}

      {(isSearching ? searched.data?.isTruncated : folder?.isTruncated) === true ? (
        <p className="px-5 pb-4 text-xs text-text-muted">
          {isSearching
            ? 'Showing the nearest matches. Open a folder to look further down it.'
            : 'Showing the first 2,000 things in this folder.'}
        </p>
      ) : null}

      <NameEntryDialog
        key={`rename-${renaming?.path ?? 'none'}`}
        isOpen={renaming !== null}
        title={`Rename ${renaming?.name ?? ''}`}
        initialName={renaming?.name ?? ''}
        confirmLabel="Rename"
        onClose={() => {
          setRenaming(null);
        }}
        onName={async (name) => {
          if (renaming === null) {
            return null;
          }

          const failure = await change(renaming, { kind: 'rename', name }, `Renamed to ${name}.`);

          if (failure === null) {
            setRenaming(null);
          }

          return failure;
        }}
      />

      <NameEntryDialog
        key={`folder-${isNamingFolder.toString()}`}
        isOpen={isNamingFolder}
        title="New folder"
        initialName=""
        confirmLabel="Create"
        onClose={() => {
          setIsNamingFolder(false);
        }}
        onName={async (name) => {
          if (at === null) {
            return null;
          }

          const failure = await failureOfThrown(() => createFolder(at, name));

          tellOutcome(`Made the folder ${name}.`, failure);

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

          void change(moving, { kind: 'move', into }, `Moved ${moving.name}.`).then((failure) => {
            if (failure === null) {
              setMoving(null);
            }
          });
        }}
      />

      <ConfirmDialog
        isOpen={condemned !== null}
        title={`Delete ${condemned?.name ?? 'this'}?`}
        detail={
          condemned?.isFolder === true
            ? 'The folder is deleted from the disk with everything in it, and the library is scanned so Valence forgets what was there. This cannot be undone.'
            : 'The file is deleted from the disk, and the library is scanned so Valence forgets it. This cannot be undone.'
        }
        confirmLabel="Delete"
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

          void change(condemned, { kind: 'delete' }, `Deleted ${condemned.name}.`).then(
            (failure) => {
              setIsDeleting(false);

              if (failure === null) {
                setCondemned(null);
              }
            },
          );
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
