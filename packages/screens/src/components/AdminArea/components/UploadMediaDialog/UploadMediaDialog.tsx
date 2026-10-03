import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useMemo, useRef, useState } from 'react';
import { FileArrowUp as FileArrowUpIcon, Folder as FolderIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { uploadMedia } from '@ValenceClient/library/uploadMedia';
import { giveUpUpload } from '@ValenceClient/library/giveUpUpload';
import { keyOfUpload, readUnfinishedUploads } from '@ValenceClient/library/unfinishedUploads';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { uploadExtensionsFor } from '@ValenceContracts/functions/uploadExtensionsFor';
import { queueUploads } from './queueUploads';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { QueuedUpload, UploadMediaDialogProps, UploadStatus } from './UploadMediaDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STATUS_WORDS: Record<UploadStatus, { label: string; tone: BadgeTone }> = {
  waiting: { label: say('common.waiting'), tone: 'quiet' },
  uploading: { label: say('screens.adminArea.uploadMediaDialog.uploading'), tone: 'busy' },
  done: { label: say('screens.adminArea.uploadMediaDialog.uploaded'), tone: 'success' },
  failed: { label: say('common.failed'), tone: 'danger' },
};

/**
 * Sends media from this device into a library: drop some files or a whole folder on it, or press it
 * to choose files, and they are uploaded one after another to where the library keeps its media,
 * keeping the folders they were in.
 *
 * Only what the library would read is queued, and what was left out is said, so nothing is uploaded
 * to a place no scan would look. Each file shows how it got on, with the server's own words where it
 * would not take one — a disk that is read-only, a file already there — and when the whole run is
 * finished the library is told to scan, so what arrived turns up without a second gesture. A large
 * file says how much of it has arrived as it goes, and the run can be stopped part of the way, which
 * throws away whatever of the file being sent had arrived.
 *
 * A large upload that stops for any other reason — the page closed, the connection gave out — is
 * remembered on this device, listed here the next time, and carries on from where it stopped when
 * the same file is chosen again; one that is not wanted any more can be forgotten.
 *
 * @param library - The library to upload into, or nothing while the dialog is shut.
 * @param folder - The folder inside the library to put them in, with `/` between folders, where
 *   it is not the library's own.
 * @param onClose - Called when it is dismissed.
 * @param onUploaded - Called with the library once something has been uploaded into it.
 */
const UploadMediaDialog = ({
  library,
  folder = '',
  onClose,
  onUploaded,
}: UploadMediaDialogProps) => {
  const into = folder.replace(/^\/+|\/+$/g, '');

  const [items, setItems] = useState<QueuedUpload[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [arrived, setArrived] = useState<Record<string, number>>({});
  const stopping = useRef<AbortController | null>(null);
  const [unfinishedSeen, setUnfinishedSeen] = useState(0);
  const unfinished = useMemo(
    () => (library === null || unfinishedSeen < 0 ? [] : readUnfinishedUploads(library.id)),
    [library, unfinishedSeen],
  );
  const targetOf = (path: string) => (into === '' ? path : `${into}/${path}`);

  const reset = () => {
    setItems([]);
    setSkipped([]);
    setHasFinished(false);
    setArrived({});
  };

  const close = () => {
    stopping.current?.abort();
    reset();
    onClose();
  };

  const add = (files: File[]) => {
    if (library === null) {
      return;
    }

    const found = queueUploads(library.kind, files, items.length);

    setItems((current) => [...current, ...found.queued]);
    setSkipped((current) => [...current, ...found.skipped]);
    setHasFinished(false);
  };

  const change = (id: string, status: UploadStatus, message: string | null = null) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status, message } : item)),
    );
  };

  const send = async () => {
    if (library === null) {
      return;
    }

    const stop = new AbortController();

    stopping.current = stop;

    const isStopped = () => stop.signal.aborted;

    setIsUploading(true);

    let uploaded = 0;

    for (const item of items.filter((one) => one.status !== 'done')) {
      if (isStopped()) {
        break;
      }

      change(item.id, 'uploading');

      try {
        await uploadMedia(library.id, targetOf(item.path), item.file, {
          signal: stop.signal,
          onProgress: (fraction) => {
            setArrived((current) => ({ ...current, [item.id]: fraction }));
          },
        });
        change(item.id, 'done');
        uploaded += 1;
      } catch (error) {
        const canCarryOn = readUnfinishedUploads(library.id).some(
          (one) => one.key === keyOfUpload(library.id, targetOf(item.path), item.file),
        );
        const said =
          error instanceof Error
            ? error.message
            : say('screens.adminArea.uploadMediaDialog.theFileCouldNotBeUploaded');

        if (isStopped()) {
          change(item.id, 'waiting');
        } else {
          change(
            item.id,
            'failed',
            canCarryOn
              ? say('screens.adminArea.uploadMediaDialog.saidPressUploadToCarryOn', { said })
              : said,
          );
        }
      }
    }

    stopping.current = null;
    setUnfinishedSeen((seen) => seen + 1);
    setIsUploading(false);
    setHasFinished(true);

    const failed = isStopped() ? 0 : items.filter((one) => one.status !== 'done').length - uploaded;

    tellOutcome(
      sayCount('screens.adminArea.uploadMediaDialog.uploadedCountFilesToName', uploaded, {
        name: library.name,
      }),
      uploaded === 0 || failed > 0
        ? sayCount('screens.adminArea.uploadMediaDialog.countFilesCouldNotBeUploaded', failed)
        : null,
    );

    if (uploaded > 0) {
      onUploaded(library);
    }
  };

  const accepted = library === null ? [] : uploadExtensionsFor(library.kind);
  const done = items.filter((item) => item.status === 'done').length;
  const isNothingToSend = items.every((item) => item.status === 'done');

  return (
    <DialogCompanion label={say('common.uploadMedia')} isOpen={library !== null} onClose={close}>
      <DialogTitle
        size="compact"
        title={
          into !== ''
            ? say('screens.adminArea.uploadMediaDialog.uploadToName', {
                name: into.split('/').at(-1) ?? into,
              })
            : library === null
              ? say('screens.adminArea.uploadMediaDialog.uploadToALibrary')
              : say('screens.adminArea.uploadMediaDialog.uploadToName', { name: library.name })
        }
        {...(into === ''
          ? {}
          : {
              detail:
                library === null
                  ? say('screens.adminArea.uploadMediaDialog.inTheLibraryAtPath', { path: into })
                  : say('screens.adminArea.uploadMediaDialog.inNameAtPath', {
                      name: library.name,
                      path: into,
                    }),
            })}
      />

      <DialogContent className="flex flex-col gap-5">
        <FilePicker
          label={say('screens.adminArea.uploadMediaDialog.chooseFilesToUpload')}
          isDropZone
          disabled={isUploading}
          accept={accepted.map((extension) => `.${extension}`).join(',')}
          onPickMany={add}
        >
          <Icon of={FileArrowUpIcon} size={28} />

          <span className="text-base font-medium text-text">
            {say('screens.adminArea.uploadMediaDialog.dropFilesOrFoldersHere')}
          </span>

          <span>{say('screens.adminArea.uploadMediaDialog.orPressToChooseFiles')}</span>

          <span className="mt-1 max-w-full text-xs text-text-muted">
            {library === null
              ? say('screens.adminArea.uploadMediaDialog.thisLibraryTakesExtensions', {
                  extensions: accepted.map((extension) => `.${extension}`).join(' '),
                })
              : say('screens.adminArea.uploadMediaDialog.nameTakesExtensions', {
                  name: library.name,
                  extensions: accepted.map((extension) => `.${extension}`).join(' '),
                })}
          </span>
        </FilePicker>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted">
            {say('screens.adminArea.uploadMediaDialog.foldersKeepTheFoldersTheyWere')}
          </span>

          <FilePicker
            label={say('screens.adminArea.uploadMediaDialog.chooseAFolderToUpload')}
            variant="ghost"
            size="sm"
            disabled={isUploading}
            isFolder
            onPickMany={add}
          >
            <Icon of={FolderIcon} size={14} />
            {say('screens.adminArea.uploadMediaDialog.chooseAFolder')}
          </FilePicker>
        </div>

        {unfinished.length === 0 || isUploading ? null : (
          <section
            aria-label={say('screens.adminArea.uploadMediaDialog.unfinishedUploads')}
            className="flex flex-col gap-1.5"
          >
            <p className="text-xs text-text-muted">
              {unfinished.length === 1
                ? say('screens.adminArea.uploadMediaDialog.oneUploadWasLeftUnfinishedChoose')
                : sayCount(
                    'screens.adminArea.uploadMediaDialog.uploadsLeftUnfinished',
                    unfinished.length,
                  )}
            </p>

            <ul className="flex flex-col gap-1">
              {unfinished.map((upload) => (
                <li
                  key={upload.key}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm"
                >
                  <span className="min-w-0 truncate text-text">{upload.path}</span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums text-xs text-text-muted">
                      {formatBytes(upload.bytes)}
                    </span>

                    <Button
                      variant="ghost"
                      size="xs"
                      label={say('screens.adminArea.uploadMediaDialog.forgetPath', {
                        path: upload.path,
                      })}
                      onClick={() => {
                        void giveUpUpload(upload).then(() => {
                          setUnfinishedSeen((seen) => seen + 1);
                        });
                      }}
                    >
                      {say('common.forget')}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {skipped.length === 0 ? null : (
          <p className="text-xs text-text-muted">
            {skipped.length === 1
              ? say('screens.adminArea.uploadMediaDialog.n1FileWasLeftOutBecause')
              : sayCount('screens.adminArea.uploadMediaDialog.filesLeftOut', skipped.length)}
          </p>
        )}

        {items.length === 0 ? null : (
          <>
            <ProgressBar
              label={say('screens.adminArea.uploadMediaDialog.uploaded')}
              value={done}
              max={items.length}
              readout={say('common.doneOfTotal', {
                done: done.toString(),
                total: items.length.toString(),
              })}
            />

            <ul
              aria-label={say('screens.adminArea.uploadMediaDialog.filesToUpload')}
              className="valence-rail flex max-h-64 flex-col gap-1 overflow-y-auto"
            >
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm">
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-text">{item.path}</span>

                    <Badge size="sm" tone={STATUS_WORDS[item.status].tone}>
                      {item.status === 'uploading' && (arrived[item.id] ?? 0) > 0
                        ? say('screens.adminArea.uploadMediaDialog.uploadingPercent', {
                            percent: Math.round((arrived[item.id] ?? 0) * 100).toString(),
                          })
                        : STATUS_WORDS[item.status].label}
                    </Badge>
                  </span>

                  {item.message === null ? null : (
                    <span role="alert" className="text-xs text-danger">
                      {item.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {hasFinished && done > 0 ? (
          <p role="status" className="text-sm text-text-muted">
            {sayCount(
              'screens.adminArea.uploadMediaDialog.countFilesUploadedTheLibraryIsBeingScanned',
              done,
            )}
          </p>
        ) : null}
      </DialogContent>

      <DialogFooter
        dismiss={
          isUploading
            ? {
                label: say('common.stop'),
                onChoose: () => {
                  stopping.current?.abort();
                },
              }
            : { label: hasFinished ? say('common.close') : say('common.cancel'), onChoose: close }
        }
        confirm={{
          label: say('common.upload'),
          onChoose: () => {
            void send();
          },
          isLoading: isUploading,
          isDisabled: isNothingToSend,
        }}
      />
    </DialogCompanion>
  );
};

UploadMediaDialog.displayName = 'UploadMediaDialog';

export { UploadMediaDialog };
