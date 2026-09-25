import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useDeferredValue, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  Folder as FolderIcon,
  FolderPlus as FolderPlusIcon,
  Search as SearchIcon,
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
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
 * A folder can be found by name, a few levels below the one being looked at, so a library several
 * folders down need not be walked to; typing a whole path instead goes straight there.
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
  const [typed, setTyped] = useState('');
  const words = useDeferredValue(typed.trim());
  const isPath = words.startsWith('/');
  const isSearching = words.length >= 2 && !isPath;
  const searched = useQuery({ ...adminQueries.folderSearch(words, at), enabled: isSearching });

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

  const open = (path: string) => {
    stopNaming();
    setTyped('');
    setAt(path);
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
      tellOutcome(say('admin.folderBrowser.madeFolder', { name: newName }), null);
      stopNaming();
      setAt(made.path);
    } catch (error) {
      const said = error instanceof Error ? error.message : say('admin.folderBrowser.couldNotMake');

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
          label={say('admin.folderBrowser.upAFolder')}
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
          label={say('admin.folderBrowser.newFolder')}
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
          aria-label={say('admin.folderBrowser.whereYouAre')}
          className="valence-rail flex min-w-0 items-center gap-0.5 overflow-x-auto"
        >
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setAt(null);
            }}
          >
            {say('admin.folderBrowser.places')}
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

      <TextField
        label={say('admin.folderBrowser.findLabel')}
        isLabelHidden
        size="sm"
        type="search"
        placeholder={
          at === null
            ? say('admin.folderBrowser.findEverywhere')
            : say('admin.folderBrowser.findHere')
        }
        value={typed}
        onValueChange={setTyped}
        icon={<Icon of={SearchIcon} size={14} />}
      />

      {isNaming ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label={say('admin.folderBrowser.folderName')}
                value={newName}
                onValueChange={setNewName}
                placeholder={say('admin.folderBrowser.folderNameExample')}
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
              {say('admin.folderBrowser.create')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              label={say('admin.folderBrowser.cancelNewFolder')}
              onClick={stopNaming}
            >
              {say('common.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="valence-rail max-h-64 min-h-32 overflow-y-auto">
        {isPath ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              open(words);
            }}
          >
            <Icon of={FolderIcon} size={16} />
            <span className="truncate">{say('admin.folderBrowser.goTo', { path: words })}</span>
          </Button>
        ) : isSearching ? (
          searched.isPending ? (
            <Spinner isCentered size="sm" label={say('admin.folderBrowser.lookingForFolders')} />
          ) : searched.isError ? (
            <CouldNotRead
              what={say('admin.folderBrowser.theFolders')}
              isTryingAgain={searched.isFetching}
              onTryAgain={() => {
                void searched.refetch();
              }}
            />
          ) : searched.data.folders.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">{say('admin.folderBrowser.noMatch')}</p>
          ) : (
            <ul aria-label={say('admin.folderBrowser.foldersFound')} className="flex flex-col">
              {searched.data.folders.map((folder) => (
                <li key={folder.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      open(folder.path);
                    }}
                  >
                    <Icon of={FolderIcon} size={16} />
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="truncate">{folder.name}</span>
                      <span className="truncate text-xs text-text-muted">{folder.path}</span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )
        ) : asked.isPending ? (
          <Spinner isCentered size="sm" label={say('admin.folderBrowser.readingFolders')} />
        ) : status === 403 ? (
          <p className="p-4 text-sm text-text-muted">{say('admin.folderBrowser.notAllowed')}</p>
        ) : isGone ? (
          <p className="p-4 text-sm text-text-muted">{say('admin.folderBrowser.folderGone')}</p>
        ) : asked.isError ? (
          <CouldNotRead
            what={say('admin.folderBrowser.theFolders')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : folders.length === 0 ? (
          <p className="p-4 text-sm text-text-muted">{say('admin.folderBrowser.noFolders')}</p>
        ) : (
          <ul aria-label={say('admin.folderBrowser.folders')} className="flex flex-col">
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

      {isSearching && searched.data?.isTruncated === true ? (
        <p className="text-xs text-text-muted">
          {say('admin.folderBrowser.nearest', { count: searched.data.folders.length })}
        </p>
      ) : null}

      {!isSearching && listing?.isTruncated === true ? (
        <p className="text-xs text-text-muted">
          {sayCount('admin.folderBrowser.firstFolders', folders.length)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-text-muted">
          {chosen ?? say('admin.folderBrowser.choosePlace')}
        </span>

        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {say('common.cancel')}
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
            {say('admin.folderBrowser.useThisFolder')}
          </Button>
        </div>
      </div>
    </div>
  );
};

FolderBrowser.displayName = 'FolderBrowser';

export { FolderBrowser };
