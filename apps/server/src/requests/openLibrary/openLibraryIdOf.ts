const WORK_KEY = /^\/?(?:works\/)?OL(\d{1,12})W$/;

/**
 * The number an Open Library work goes by, out of the key it is listed under: `/works/OL27448W`, or
 * just `OL27448W`.
 *
 * @param key - The work's key.
 * @returns Its number, or null where the key is not a work's.
 */
const openLibraryIdOf = (key: string): number | null => {
  const found = WORK_KEY.exec(key);
  const id = found === null ? Number.NaN : Number(found[1]);

  return Number.isInteger(id) && id > 0 ? id : null;
};

export { openLibraryIdOf };
