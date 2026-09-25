const IGNORED_FOLDERS = new Set([
  'sample',
  'minta',
  'metadata',
  'ps3_update',
  'ps3_vprm',
  'extrafanart',
  'extrathumbs',
  'lost+found',
  'subs',
  'temprec',
  'tempsbe',
  'eadir',
  '@eadir',
  '#recycle',
  '@recycle',
  '$recycle.bin',
  'system volume information',
]);

const IGNORED_FILE =
  /^(?:sample|minta)\.[^.]{1,5}$|\.(?:sample|minta)\.[^.]{1,5}$|\.(?:bts|sync|trickplay)$|^thumbs\.db$/iu;

/**
 * Whether a path is somewhere Jellyfin never looks for media: hidden files and folders, a NAS's
 * recycle bin and thumbnail caches, filesystem snapshots, `lost+found`, a release's `Sample` folder
 * and `sample.mkv` files, and the metadata folders other tools leave beside a library.
 *
 * @param path - The path, from the library's top folder down.
 * @returns Whether to leave it out of the library.
 */
const isIgnoredPath = (path: string): boolean => {
  const parts = path.split('/').filter((part) => part !== '');
  const fileName = parts.at(-1) ?? '';

  return (
    parts.some((part) => part.startsWith('.')) ||
    parts.slice(0, -1).some((part) => IGNORED_FOLDERS.has(part.toLowerCase())) ||
    IGNORED_FILE.test(fileName)
  );
};

export { isIgnoredPath };
