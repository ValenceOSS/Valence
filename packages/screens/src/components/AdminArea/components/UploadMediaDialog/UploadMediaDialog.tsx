import { useState } from 'react';
import { File as FileIcon, Folder as FolderIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { uploadMedia } from '@ValenceClient/library/uploadMedia';
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
 * Sends media from this device into a library: pick some files, or a whole folder, and they are
 * uploaded one after another to where the library keeps its media, keeping the folders they were in.
 *
 * Only what the library would read is queued, and what was left out is said, so nothing is uploaded
 * to a place no scan would look. Each file shows how it got on, with the server's own words where it
 * would not take one — a disk that is read-only, a file already there — and when the whole run is
 * finished the library is told to scan, so what arrived turns up without a second gesture.
 *
 * @param library - The library to upload into, or nothing while the dialog is shut.
 * @param onClose - Called when it is dismissed.
 * @param onUploaded - Called with the library once something has been uploaded into it.
 */
const UploadMediaDialog = ({ library, onClose, onUploaded }: UploadMediaDialogProps) => {
  const [items, setItems] = useState<QueuedUpload[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const reset = () => {
    setItems([]);
    setSkipped([]);
    setHasFinished(false);
  };

  const close = () => {
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

    setIsUploading(true);

    let uploaded = 0;

    for (const item of items.filter((one) => one.status !== 'done')) {
      change(item.id, 'uploading');

      try {
        await uploadMedia(library.id, item.path, item.file);
        change(item.id, 'done');
        uploaded += 1;
      } catch (error) {
        change(
          item.id,
          'failed',
          error instanceof Error ? error.message : 'The file could not be uploaded.',
        );
      }
    }

    setIsUploading(false);
    setHasFinished(true);

    if (uploaded > 0) {
      onUploaded(library);
    }
  };

  const done = items.filter((item) => item.status === 'done').length;
  const isNothingToSend = items.every((item) => item.status === 'done');

  return (
    <DialogCompanion label="Upload media" isOpen={library !== null} onClose={close}>
      <DialogTitle size="compact" title={`Upload to ${library?.name ?? 'a library'}`} />

      <DialogContent className="flex flex-col gap-5">
        <p className="text-sm text-text-muted">
          Choose files or a whole folder from this device. They are copied to where this library
          keeps its media, keeping the folders they were in, and the library is scanned when they
          are there.
        </p>

        <div className="flex flex-wrap gap-2">
          <FilePicker
            label="Choose files to upload"
            variant="secondary"
            size="sm"
            disabled={isUploading}
            onPickMany={add}
          >
            <Icon of={FileIcon} size={14} />
            Choose files
          </FilePicker>

          <FilePicker
            label="Choose a folder to upload"
            variant="secondary"
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
                      {STATUS_WORDS[item.status].label}
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
        dismiss={{
          label: hasFinished ? 'Close' : 'Cancel',
          onChoose: close,
          isDisabled: isUploading,
        }}
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
