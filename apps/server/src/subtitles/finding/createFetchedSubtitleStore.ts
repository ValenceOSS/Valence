import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { FetchedSubtitleEntrySchema } from './FetchedSubtitle';
import type { FetchedSubtitleEntry } from './FetchedSubtitle';

const INDEX = 'index.json';

const CHECKED = 'checked';

const SAFE_ID = /^[0-9a-f-]{36}$/i;

type FetchedSubtitleStore = {
  list: (mediaId: string) => Promise<FetchedSubtitleEntry[]>;
  save: (
    mediaId: string,
    entry: Omit<FetchedSubtitleEntry, 'file' | 'fetchedAt'>,
    bytes: Uint8Array,
  ) => Promise<FetchedSubtitleEntry>;
  pathOf: (mediaId: string, entry: FetchedSubtitleEntry) => string;
  checkedAt: (mediaId: string) => Promise<Date | null>;
  markChecked: (mediaId: string) => Promise<void>;
};

/**
 * Keeps the subtitles Valence fetched inside its own data rather than beside the media, so a
 * library mounted read-only can have them and nothing is written among somebody's files: a folder
 * for each film or episode, holding one subtitle for each language and a list of where each came
 * from and how well it fit, and when it was last looked for. A better one in a language replaces the
 * one there.
 *
 * @param root - The folder they are all kept under.
 * @param now - The clock.
 * @returns The store.
 */
const createFetchedSubtitleStore = (
  root: string,
  now: () => Date = () => new Date(),
): FetchedSubtitleStore => {
  const folderOf = (mediaId: string): string | null =>
    SAFE_ID.test(mediaId) ? join(root, mediaId) : null;

  const list = async (mediaId: string): Promise<FetchedSubtitleEntry[]> => {
    const folder = folderOf(mediaId);

    if (folder === null) {
      return [];
    }

    const read = await readFile(join(folder, INDEX), 'utf8').catch(() => null);

    try {
      const parsed = z
        .array(FetchedSubtitleEntrySchema)
        .safeParse(read === null ? [] : JSON.parse(read));

      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  };

  return {
    list,

    save: async (mediaId, entry, bytes) => {
      const folder = folderOf(mediaId);

      if (folder === null) {
        throw new Error('not a media id');
      }

      const language = entry.language.toLowerCase().replace(/[^a-z-]/g, '');
      const kept: FetchedSubtitleEntry = {
        ...entry,
        language,
        file: `${language}.${entry.format}`,
        fetchedAt: now().toISOString(),
      };
      const was = await list(mediaId);

      await mkdir(folder, { recursive: true });

      for (const replaced of was.filter((one) => one.language === language)) {
        if (replaced.file !== kept.file) {
          await rm(join(folder, replaced.file), { force: true });
        }
      }

      await writeFile(join(folder, kept.file), bytes);
      await writeFile(
        join(folder, INDEX),
        JSON.stringify([...was.filter((one) => one.language !== language), kept], null, 2),
      );

      return kept;
    },

    pathOf: (mediaId, entry) => join(root, mediaId, entry.file),

    checkedAt: async (mediaId) => {
      const folder = folderOf(mediaId);
      const read =
        folder === null ? null : await readFile(join(folder, CHECKED), 'utf8').catch(() => null);
      const when = read === null ? Number.NaN : Date.parse(read);

      return Number.isNaN(when) ? null : new Date(when);
    },

    markChecked: async (mediaId) => {
      const folder = folderOf(mediaId);

      if (folder === null) {
        return;
      }

      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, CHECKED), now().toISOString());
    },
  };
};

export type { FetchedSubtitleStore };

export { createFetchedSubtitleStore };
