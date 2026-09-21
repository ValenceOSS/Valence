import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  Folder as FolderIcon,
  FolderPlus as FolderPlusIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { createFolder } from '@ValenceClient/admin/createFolder';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { pathSegments } from '@ValenceScreens/components/AdminArea/components/FolderBrowser/pathSegments';
import type { FolderBrowserProps } from './FolderBrowser.types';

/**
 * Walks the folders on the machine running Valence, so whoever adds a library can point at where it
 * lives instead of typing a path they have to remember exactly.
 *
 * Opens on the folder already typed, where there is one and it exists, and on the places worth
 * starting from otherwise — the top of the disk, the home folder, and wherever drives are usually
 * mounted. Only folders are shown, since a library is a folder. The trail along the top steps back
 * to any folder on the way down, and the folder being looked at is the one chosen: a library is the
 * folder you are in, not one of the folders inside it.
 *
 * A new folder can be made in the one being looked at, which is then opened, so a library can be
 * given somewhere to live without leaving the page for a terminal. Where the disk will not allow
 * it, the server's own words are shown, since they say what to change.
 *
 * @param start - The path already typed, which it opens on where it can.
 * @param onChoose - Told the folder chosen.
 * @param onCancel - Told to close without choosing.
 */
const FolderBrowser = ({ start, onChoose, onCancel }: FolderBrowserProps) => {
  const first = start.trim() === '' ? null : start.trim();
  const [at, setAt] = useState<string | null>(first);

  const asked = useQuery(adminQueries.folders(at));
  const cache = useQueryClient();
  const [isNaming, setIsNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isMaking, setIsMaking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const status = asked.error instanceof RequestFailed ? asked.error.status : null;
  const isGone = status === 404 || status === 400;

  useEffect(() => {
    if (isGone && at !== null && at === first) {
      setAt(null);
    }
  }, [isGone, at, first]);

  const listing = asked.data ?? null;
  const folders = listing?.folders ?? [];
  const chosen = listing?.path ?? null;

  const stopNaming = () => {
    setIsNaming(false);
    setNewName('');
    setProblem(null);
  };

  const make = async () => {
    if (chosen === null) {
      return;
    }

    setIsMaking(true);
    setProblem(null);

    try {
      const made = await createFolder(chosen, newName);

      await cache.invalidateQueries({ queryKey: adminQueries.folders(chosen).queryKey });
      tellOutcome(`Made the folder ${newName}.`, null);
      stopNaming();
      setAt(made.path);
    } catch (error) {
      const said = error instanceof Error ? error.message : 'The folder could not be made.';

      setProblem(said);
      tellOutcome('', said);
    } finally {
      setIsMaking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--surface-line)] p-3">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          isIconOnly
          variant="secondary"
          size="xs"
          label="Up a folder"
          disabled={at === null}
          onClick={() => {
            stopNaming();
            setAt(listing?.parent ?? null);
          }}
        >
          <Icon of={ChevronUpIcon} size={14} />
        </Button>

        <Button
          isIconOnly
          variant="secondary"
          size="xs"
          label="New folder"
          disabled={chosen === null}
          isActive={isNaming}
          onClick={() => {
            if (isNaming) {
              stopNaming();
            } else {
              setIsNaming(true);
            }
          }}
        >
          <Icon of={FolderPlusIcon} size={14} />
        </Button>

        <nav
          aria-label="Where you are"
          className="valence-rail flex min-w-0 items-center gap-0.5 overflow-x-auto"
        >
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setAt(null);
            }}
          >
            Places
          </Button>

          {at === null
            ? null
            : pathSegments(at).map((segment) => (
                <span key={segment.path} className="flex shrink-0 items-center gap-0.5">
                  <Icon of={ChevronRightIcon} size={12} tone="muted" />

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setAt(segment.path);
                    }}
                  >
                    {segment.label}
                  </Button>
                </span>
              ))}
        </nav>
      </div>

      {isNaming ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label="Folder name"
                value={newName}
                onValueChange={setNewName}
                placeholder="anime"
                size="sm"
                {...(problem === null ? {} : { error: problem })}
              />
            </div>

            <Button
              variant="glossy"
              size="sm"
              isLoading={isMaking}
              disabled={newName.trim() === ''}
              onClick={() => {
                void make();
              }}
            >
              Create
            </Button>

            <Button variant="ghost" size="sm" label="Cancel the new folder" onClick={stopNaming}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="valence-rail max-h-64 min-h-32 overflow-y-auto">
        {asked.isPending ? (
          <Spinner isCentered size="sm" label="Reading the folders" />
        ) : status === 403 ? (
          <p className="p-4 text-sm text-text-muted">Valence is not allowed to read that folder.</p>
        ) : isGone ? (
          <p className="p-4 text-sm text-text-muted">That folder is not there.</p>
        ) : asked.isError ? (
          <CouldNotRead
            what="The folders"
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : folders.length === 0 ? (
          <p className="p-4 text-sm text-text-muted">No folders in here.</p>
        ) : (
          <ul aria-label="Folders" className="flex flex-col">
            {folders.map((folder) => (
              <li key={folder.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    stopNaming();
                    setAt(folder.path);
                  }}
                >
                  <Icon of={FolderIcon} size={16} />
                  <span className="truncate">{folder.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {listing?.isTruncated === true ? (
        <p className="text-xs text-text-muted">
          Showing the first {folders.length.toString()} folders.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-text-muted">
          {chosen ?? 'Choose a place to start'}
        </span>

        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            variant="glossy"
            size="sm"
            disabled={chosen === null}
            onClick={() => {
              if (chosen !== null) {
                onChoose(chosen);
              }
            }}
          >
            Use this folder
          </Button>
        </div>
      </div>
    </div>
  );
};

FolderBrowser.displayName = 'FolderBrowser';

export { FolderBrowser };
