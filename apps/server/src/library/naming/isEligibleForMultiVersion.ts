import { cleanString } from './cleanString';

/**
 * Whether a file in a film's folder can be one version of that film, by Jellyfin's rule: its name
 * starts with the folder's, and whatever follows, once cleaned of release noise, is nothing or
 * begins with a separator or a bracketed label — `Heat - Director's Cut`, `Heat [4K]` — rather than
 * more title, which is what keeps `Aliens` from becoming a version of `Alien`.
 *
 * @param folderName - The film's folder name.
 * @param fileStem - The file's name without its extension.
 * @returns Whether it can be a version of the folder's film.
 */
const isEligibleForMultiVersion = (folderName: string, fileStem: string): boolean => {
  if (!fileStem.toLowerCase().startsWith(folderName.toLowerCase())) {
    return false;
  }

  const rest = fileStem.slice(folderName.length).trim();
  const cleaned = (cleanString(rest) ?? rest).trim();

  return (
    cleaned === '' ||
    cleaned.startsWith('-') ||
    cleaned.startsWith('_') ||
    cleaned.startsWith('.') ||
    /^\[[^\]]*\]/u.test(cleaned)
  );
};

export { isEligibleForMultiVersion };
