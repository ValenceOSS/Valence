import { z } from 'zod';

const STORAGE_KEY = 'valence.changelogSeen';

/**
 * Reads which release's changes this viewer last saw, on this device.
 *
 * @returns The version, or nothing where they have seen none here.
 */
const readChangelogSeen = (): string | null => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);

    return held === null ? null : z.string().nullable().catch(null).parse(JSON.parse(held));
  } catch {
    return null;
  }
};

/**
 * Remembers that this viewer has seen a release's changes, on this device.
 *
 * @param version - The release seen.
 */
const saveChangelogSeen = (version: string): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(version));
  } catch {}
};

export { readChangelogSeen, saveChangelogSeen };
