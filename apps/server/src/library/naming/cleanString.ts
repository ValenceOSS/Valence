import { CLEAN_STRINGS } from './CLEAN_STRINGS';

/**
 * Cuts the release noise off a name the way Jellyfin does: everything from the first resolution,
 * source, codec or edition tag onwards, bracketed tags at either end, a trailing episode range or
 * number, and an extra's suffix. Words before the first tag are never touched, so a title that
 * happens to contain one of them keeps it.
 *
 * @param name - A file or folder name, usually with its year already taken off.
 * @returns The cleaned name, or null where nothing needed cleaning.
 */
const cleanString = (name: string): string | null => {
  let cleaned: string | null = null;

  for (const pattern of CLEAN_STRINGS) {
    const match = pattern.exec(cleaned ?? name);
    const kept = match?.groups?.cleaned;

    if (kept !== undefined) {
      cleaned = kept.trim();
    }
  }

  return cleaned;
};

export { cleanString };
