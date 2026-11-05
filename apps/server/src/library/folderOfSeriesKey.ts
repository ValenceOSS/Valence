const FOLDER_KEY = 'folder:';

/**
 * Reads the folder a programme is kept under from the key it is filed by, which names its folder
 * wherever its episodes sit in one of their own.
 *
 * @param key - The programme's key.
 * @returns Its folder, or null where it is filed by its catalogue entry or its title instead.
 */
const folderOfSeriesKey = (key: string): string | null =>
  key.startsWith(FOLDER_KEY) ? key.slice(FOLDER_KEY.length) : null;

export { folderOfSeriesKey };
