type DroppedEntry = {
  isFile: boolean;
  isDirectory: boolean;
  fullPath: string;
  file?: (done: (file: File) => void, fail: () => void) => void;
  createReader?: () => {
    readEntries: (done: (entries: DroppedEntry[]) => void, fail: () => void) => void;
  };
};

type Dropped = {
  items: Iterable<{ webkitGetAsEntry: () => DroppedEntry | null }>;
  files: Iterable<File>;
};

/**
 * Gives a file the path it had inside the folder it was dropped from, which a file read that way
 * does not carry as one chosen in a file dialog does.
 *
 * @param file - The file.
 * @param path - Where it was, from the folder that was dropped, such as `Show/Season 1/S01E01.mkv`.
 * @returns The same file, now carrying its path.
 */
const withPath = (file: File, path: string): File => {
  Object.defineProperty(file, 'webkitRelativePath', { value: path, configurable: true });

  return file;
};

/**
 * Reads a file out of the entry for it.
 *
 * @param entry - The entry.
 * @returns The file, or nothing where it could not be read.
 */
const readFile = async (entry: DroppedEntry): Promise<File | null> =>
  new Promise((resolve) => {
    if (entry.file === undefined) {
      resolve(null);

      return;
    }

    entry.file(resolve, () => {
      resolve(null);
    });
  });

/**
 * Reads everything in a folder, however many batches the browser hands it in — it gives a hundred at
 * a time and says it is done by giving none.
 *
 * @param entry - The folder.
 * @returns What is in it.
 */
const readFolder = async (entry: DroppedEntry): Promise<DroppedEntry[]> => {
  const reader = entry.createReader?.();
  const found: DroppedEntry[] = [];

  if (reader === undefined) {
    return found;
  }

  for (;;) {
    const batch = await new Promise<DroppedEntry[]>((resolve) => {
      reader.readEntries(resolve, () => {
        resolve([]);
      });
    });

    if (batch.length === 0) {
      return found;
    }

    found.push(...batch);
  }
};

/**
 * Every file below an entry, a folder followed all the way down, each carrying the path it was at.
 *
 * @param entry - A file or a folder.
 * @returns Its files.
 */
const filesBelow = async (entry: DroppedEntry): Promise<File[]> => {
  if (entry.isFile) {
    const file = await readFile(entry);

    return file === null ? [] : [withPath(file, entry.fullPath.replace(/^\//, ''))];
  }

  if (entry.isDirectory) {
    return (await Promise.all((await readFolder(entry)).map(filesBelow))).flat();
  }

  return [];
};

/**
 * Reads what was dropped: files, whole folders, or both at once, with each file inside a folder
 * carrying the path it had in it. A file dropped by itself carries no path, as one chosen in a file
 * dialog does not.
 *
 * Where the browser cannot say what a dropped item is, the files it lists are taken as they are.
 *
 * @param transfer - What was dropped.
 * @returns Every file dropped, and every file inside every folder dropped.
 */
const readDroppedFiles = async (transfer: Dropped): Promise<File[]> => {
  const entries = [...transfer.items].flatMap((item) => {
    const entry = item.webkitGetAsEntry();

    return entry === null ? [] : [entry];
  });

  if (entries.length === 0) {
    return [...transfer.files];
  }

  const found = (await Promise.all(entries.map(filesBelow))).flat();

  return found.map((file) =>
    file.webkitRelativePath.split('/').length === 1 ? withPath(file, '') : file,
  );
};

export type { Dropped, DroppedEntry };

export { readDroppedFiles };
