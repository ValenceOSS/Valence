import { parseFile } from 'music-metadata';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';

/**
 * How many minutes an audiobook download lasts, every one of its audio files together, read from
 * each file's own header.
 *
 * @param contentPath - Where the download is.
 * @returns The minutes, or null where no file could be measured.
 */
const measureListening = async (contentPath: string): Promise<number | null> => {
  const files = (await findDownloadedFiles(contentPath)).filter((file) =>
    AUDIOBOOK_FILE_EXTENSIONS.has(file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()),
  );
  const seconds = await Promise.all(
    files.map(async (file) =>
      parseFile(file.path, { duration: true, skipCovers: true })
        .then((meta) => meta.format.duration ?? 0)
        .catch(() => 0),
    ),
  );
  const total = seconds.reduce((sum, each) => sum + each, 0);

  return total > 0 ? total / 60 : null;
};

export { measureListening };
