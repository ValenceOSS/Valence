import Conf from 'conf';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';

let opened: Conf<Record<string, string>> | null = null;

const kept = new Map<string, string>();

const StoredSchema = z.record(z.string(), JsonValueSchema);

type PreferenceFile = {
  all: () => Record<string, string>;

  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  forget: (key: string) => void;
};

/**
 * Holds in memory what the file now says, its text values only.
 *
 * @param store - What the file holds.
 */
const keepWhatIsIn = (store: object): void => {
  const read = StoredSchema.safeParse(store);

  kept.clear();

  for (const [key, value] of Object.entries(read.success ? read.data : {})) {
    if (typeof value === 'string') {
      kept.set(key, value);
    }
  }
};

/**
 * Where this client keeps what belongs to the machine rather than to the account — which server it
 * watches, which profile is watching, the quality somebody pinned.
 *
 * Held by the main process rather than by the window. A window's web storage belongs to an origin,
 * and this client does not keep one: it is served from a dev server while it is being worked on and
 * from a file once it is built, so anything kept in one is invisible to the other. Somebody would
 * say where their Valence is, build the application, and be asked all over again.
 *
 * Opened once, and read once. Every request leaving this client asks where the server is, and the
 * file's own reading goes to the disk each time it is asked, which meant reading and parsing it for
 * every image, every subtitle and every segment of everything anybody watches. What it holds is kept
 * in memory instead, and kept up to date as it changes, from this process or, since the development
 * build shares the file, from another.
 *
 * A dot in a key is part of the key. The library reads one as a path by default, so
 * `valence.server.address` became three nested objects and came back as nothing at all — which is every
 * preference Valence has, and which meant this client forgot where its server was the moment it was
 * told.
 *
 * @returns The file, as three things the rest of the process can do to it.
 */
const thePreferenceFile = (): PreferenceFile => {
  if (opened === null) {
    opened = new Conf<Record<string, string>>({
      projectName: 'valence',
      configName: 'preferences',
      accessPropertiesByDotNotation: false,
      watch: true,
    });
    keepWhatIsIn(opened.store);
    opened.onDidAnyChange((now) => {
      keepWhatIsIn(now);
    });
  }

  const held = opened;

  return {
    all: () => Object.fromEntries(kept),
    read: (key) => kept.get(key) ?? null,
    write: (key, value) => {
      held.set(key, value);
      kept.set(key, value);
    },
    forget: (key) => {
      held.delete(key);
      kept.delete(key);
    },
  };
};

export type { PreferenceFile };

export { thePreferenceFile };
