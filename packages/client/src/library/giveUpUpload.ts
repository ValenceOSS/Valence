import { forgetUnfinishedUpload } from '@ValenceClient/library/unfinishedUploads';
import type { UnfinishedUpload } from '@ValenceClient/library/unfinishedUploads';

/**
 * Gives up an unfinished upload for good: the server throws away what arrived, and this device stops
 * offering to carry it on. The device forgets it whether or not the server answers, since an upload
 * the server has already lost is given up either way.
 *
 * @param upload - The upload.
 */
const giveUpUpload = async (upload: UnfinishedUpload): Promise<void> => {
  await fetch(`/api/libraries/${upload.libraryId}/uploads/${upload.uploadId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  forgetUnfinishedUpload(upload.key);
};

export { giveUpUpload };
