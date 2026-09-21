import { isUploadableTo } from '@ValenceContracts/functions/isUploadableTo';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { QueuedUpload } from './UploadMediaDialog.types';

/**
 * Sorts what somebody chose into what a library will take and what it will not, and gives each
 * file the path it will have inside the library: the path it had within a chosen folder, or just its
 * name where it was chosen alone.
 *
 * @param kind - The kind of library the files are for.
 * @param files - What was chosen.
 * @param first - The number to give the first one, so that files added later stay distinct.
 * @returns The uploads to make, and the names of the files left out.
 */
const queueUploads = (
  kind: LibraryKind,
  files: readonly File[],
  first = 0,
): { queued: QueuedUpload[]; skipped: string[] } => {
  const queued: QueuedUpload[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const path = file.webkitRelativePath === '' ? file.name : file.webkitRelativePath;

    if (isUploadableTo(kind, path)) {
      queued.push({
        id: `${(first + queued.length).toString()}:${path}`,
        path,
        file,
        status: 'waiting',
        message: null,
      });
    } else {
      skipped.push(path);
    }
  }

  return { queued, skipped };
};

export { queueUploads };
