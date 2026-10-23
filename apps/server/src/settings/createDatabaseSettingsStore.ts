import { eq } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { JsonObjectSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { serverSetting } from '#dialect/Schema';
import { ServerSettingsSchema, SETTINGS_KEY } from './ServerSettings';
import type { ServerSettings, SettingsStore } from './ServerSettings';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type CreateDatabaseSettingsStoreOptions = {
  db: AnyValenceDatabase;
  defaults: ServerSettings;
  onFellBack?: (fields: string[]) => void;
};

type StoredSettings = Record<string, JsonValue>;

type Settled = { settings: ServerSettings; fellBack: string[] };

const FIELDS = Object.entries(ServerSettingsSchema.shape);

/**
 * The server's own settings, held in one row of the database — everything an operator configures that is
 * not an environment variable, from the catalogue key to what this instance calls itself.
 *
 * A field that cannot be read falls back to its default on its own, so one value this release does
 * not understand, such as one a newer release saved before being rolled back, costs that setting
 * rather than every setting. Saving keeps what was stored for such a field, and for any field this
 * release does not know, so the next save does not make the loss permanent. Saves wait for one
 * another, so two at once both land.
 *
 * @param options - The database to read and write, the settings to start from, and what to tell
 *   when stored fields could not be read.
 * @returns The settings store.
 */
const createDatabaseSettingsStore = ({
  db,
  defaults,
  onFellBack,
}: CreateDatabaseSettingsStoreOptions): SettingsStore => {
  let reported = '';
  let saving: Promise<void> = Promise.resolve();

  const readStored = async (): Promise<StoredSettings | null> => {
    const rows = await db
      .select()
      .from(serverSetting)
      .where(eq(serverSetting.key, SETTINGS_KEY))
      .limit(1);

    const row = rows[0];

    if (row === undefined) {
      return null;
    }

    const stored = JsonObjectSchema.safeParse(row.value);

    return stored.success ? stored.data : {};
  };

  const settle = (stored: StoredSettings): Settled => {
    const whole = ServerSettingsSchema.safeParse(stored);

    if (whole.success) {
      return { settings: whole.data, fellBack: [] };
    }

    const kept = new Map(Object.entries(defaults));
    const fellBack: string[] = [];

    for (const [name, schema] of FIELDS) {
      const one = schema.safeParse(stored[name]);

      if (one.success) {
        kept.set(name, one.data);
      } else {
        fellBack.push(name);
      }
    }

    const pieced = ServerSettingsSchema.safeParse(Object.fromEntries(kept));

    return pieced.success
      ? { settings: pieced.data, fellBack }
      : { settings: defaults, fellBack: FIELDS.map(([name]) => name) };
  };

  const tell = (fellBack: string[]) => {
    const said = fellBack.join(',');

    if (said !== reported) {
      reported = said;

      if (fellBack.length > 0) {
        onFellBack?.(fellBack);
      }
    }
  };

  const read = async (): Promise<ServerSettings> => {
    const stored = await readStored();

    if (stored === null) {
      return defaults;
    }

    const { settings, fellBack } = settle(stored);

    tell(fellBack);

    return settings;
  };

  const writeNow = async (patch: Partial<ServerSettings>): Promise<ServerSettings> => {
    const stored = (await readStored()) ?? {};
    const { settings, fellBack } = settle(stored);
    const next = ServerSettingsSchema.parse({ ...settings, ...patch });
    const known = new Set(FIELDS.map(([name]) => name));
    const keptAsStored = Object.fromEntries(
      Object.entries(stored).filter(
        ([name]) => !(name in patch) && (!known.has(name) || fellBack.includes(name)),
      ),
    );
    const value = { ...next, ...keptAsStored };

    await upsert(db, serverSetting, {
      values: [{ key: SETTINGS_KEY, value, updatedAt: new Date() }],
      target: serverSetting.key,
      set: { value, updatedAt: new Date() },
    });

    return next;
  };

  const write = (patch: Partial<ServerSettings>): Promise<ServerSettings> => {
    const written = saving.then(() => writeNow(patch));

    saving = written.then(
      () => undefined,
      () => undefined,
    );

    return written;
  };

  return { read, write };
};

export { createDatabaseSettingsStore };
