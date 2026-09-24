import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useRef, useState } from 'react';
import { FileArrowUp as FileArrowUpIcon, Folder as FolderIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { uploadMedia } from '@ValenceClient/library/uploadMedia';
import { uploadExtensionsFor } from '@ValenceContracts/functions/uploadExtensionsFor';
import { queueUploads } from './queueUploads';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { QueuedUpload, UploadMediaDialogProps, UploadStatus } from './UploadMediaDialog.types';

const STATUS_WORDS: Record<UploadStatus, { label: string; tone: BadgeTone }> = {
  waiting: { label: 'Waiting', tone: 'quiet' },
  uploading: { label: 'Uploading', tone: 'busy' },
  done: { label: 'Uploaded', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
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
        await uploadMedia(library.id, into === '' ? item.path : `${into}/${item.path}`, item.file, {
          signal: stop.signal,
          onProgress: (fraction) => {
            setArrived((current) => ({ ...current, [item.id]: fraction }));
          },
        });
        change(item.id, 'done');
        uploaded += 1;
      } catch (error) {
        if (isStopped()) {
          change(item.id, 'waiting');
        } else {
          change(
            item.id,
            'failed',
            error instanceof Error ? error.message : 'The file could not be uploaded.',
          );
        }
      }
    }

    stopping.current = null;
    setIsUploading(false);
    setHasFinished(true);

    const failed = isStopped() ? 0 : items.filter((one) => one.status !== 'done').length - uploaded;

    tellOutcome(
      `Uploaded ${uploaded.toString()} ${uploaded === 1 ? 'file' : 'files'} to ${library.name}.`,
      uploaded === 0 || failed > 0
        ? `${failed.toString()} ${failed === 1 ? 'file' : 'files'} could not be uploaded.`
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
    <DialogCompanion label="Upload media" isOpen={library !== null} onClose={close}>
      <DialogTitle
        size="compact"
        title={`Upload to ${into === '' ? (library?.name ?? 'a library') : (into.split('/').at(-1) ?? into)}`}
        {...(into === '' ? {} : { detail: `In ${library?.name ?? 'the library'}, at ${into}` })}
      />

      <DialogContent className="flex flex-col gap-5">
        <FilePicker
          label="Choose files to upload"
          isDropZone
          disabled={isUploading}
          accept={accepted.map((extension) => `.${extension}`).join(',')}
          onPickMany={add}
        >
          <Icon of={FileArrowUpIcon} size={28} />

          <span className="text-base font-medium text-text">Drop files or folders here</span>

          <span>or press to choose files</span>

          <span className="mt-1 max-w-full text-xs text-text-muted">
            {`${library?.name ?? 'This library'} takes ${accepted.map((extension) => `.${extension}`).join(' ')}`}
          </span>
        </FilePicker>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted">
            Folders keep the folders they were in, and the library is scanned once they are there.
          </span>

          <FilePicker
            label="Choose a folder to upload"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            isFolder
            onPickMany={add}
          >
            <Icon of={FolderIcon} size={14} />
            Choose a folder
          </FilePicker>
        </div>

        {skipped.length === 0 ? null : (
          <p className="text-xs text-text-muted">
            {skipped.length === 1
              ? '1 file was left out because this library does not read it.'
              : `${skipped.length.toString()} files were left out because this library does not read them.`}
          </p>
        )}

        {items.length === 0 ? null : (
          <>
            <ProgressBar
              label="Uploaded"
              value={done}
              max={items.length}
              readout={`${done.toString()} of ${items.length.toString()}`}
            />

            <ul
              aria-label="Files to upload"
              className="valence-rail flex max-h-64 flex-col gap-1 overflow-y-auto"
            >
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm">
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-text">{item.path}</span>

                    <Badge size="sm" tone={STATUS_WORDS[item.status].tone}>
                      {item.status === 'uploading' && (arrived[item.id] ?? 0) > 0
                        ? `${STATUS_WORDS[item.status].label} ${Math.round((arrived[item.id] ?? 0) * 100).toString()}%`
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
            {done === 1 ? '1 file' : `${done.toString()} files`} uploaded. The library is being
            scanned.
          </p>
        ) : null}
      </DialogContent>

      <DialogFooter
        dismiss={
          isUploading
            ? {
                label: 'Stop',
                onChoose: () => {
                  stopping.current?.abort();
                },
              }
            : { label: hasFinished ? 'Close' : 'Cancel', onChoose: close }
        }
        confirm={{
          label: 'Upload',
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
