import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { ConnectionRecord, InstalledRecord, PluginStore } from './PluginStore';

/**
 * Plugins held in memory, for tests and for a server built without a database: the same rules as
 * the database, including that uninstalling a plugin forgets what it kept and who connected to it.
 *
 * @param now - The clock, for the times a record keeps.
 * @returns The store.
 */
const createMemoryPluginStore = (now: () => Date = () => new Date()): PluginStore => {
  const installed = new Map<string, InstalledRecord>();
  const values = new Map<string, Map<string, { value: JsonValue; bytes: number }>>();
  const connections = new Map<string, ConnectionRecord>();
  const profiles = new Map<string, Set<string>>();
  const hooks = new Map<string, Map<string, string>>();
  const previous = new Map<
    string,
    { record: InstalledRecord; values: Map<string, { value: JsonValue; bytes: number }> }
  >();

  const withPrevious = (record: InstalledRecord): InstalledRecord => ({
    ...record,
    previousVersion: previous.get(record.id)?.record.version ?? null,
  });

  const connectionKey = (pluginId: string, profileId: string, provider: string): string =>
    JSON.stringify([pluginId, profileId, provider]);

  const kept = (pluginId: string): Map<string, { value: JsonValue; bytes: number }> => {
    const found = values.get(pluginId) ?? new Map<string, { value: JsonValue; bytes: number }>();

    values.set(pluginId, found);

    return found;
  };

  return {
    list: () =>
      Promise.resolve(
        [...installed.values()].sort((a, b) => a.id.localeCompare(b.id)).map(withPrevious),
      ),
    read: (id) => {
      const found = installed.get(id);

      return Promise.resolve(found === undefined ? null : withPrevious(found));
    },
    save: (record) => {
      const was = installed.get(record.id);
      const at = now().toISOString();

      installed.set(record.id, {
        ...record,
        installedAt: was?.installedAt ?? at,
        updatedAt: at,
        problem: null,
        previousVersion: null,
      });

      return Promise.resolve();
    },
    readHooks: (pluginId) => Promise.resolve(Object.fromEntries(hooks.get(pluginId) ?? [])),
    saveHook: (pluginId, hookId, secret) => {
      hooks.set(pluginId, new Map([...(hooks.get(pluginId) ?? []), [hookId, secret]]));

      return Promise.resolve();
    },
    forgetHooksExcept: (pluginId, keep) => {
      hooks.set(
        pluginId,
        new Map([...(hooks.get(pluginId) ?? [])].filter(([hookId]) => keep.includes(hookId))),
      );

      return Promise.resolve();
    },
    keepPrevious: (id) => {
      const was = installed.get(id);

      if (was === undefined) {
        return Promise.resolve(false);
      }

      previous.set(id, { record: was, values: new Map(kept(id)) });

      return Promise.resolve(true);
    },
    restorePrevious: (id) => {
      const earlier = previous.get(id);
      const current = installed.get(id);

      if (earlier === undefined || current === undefined) {
        return Promise.resolve(false);
      }

      installed.set(id, {
        ...current,
        version: earlier.record.version,
        trust: earlier.record.trust,
        manifest: earlier.record.manifest,
        packageBase64: earlier.record.packageBase64,
        sha256: earlier.record.sha256,
        updatedAt: now().toISOString(),
        problem: null,
      });
      values.set(id, new Map(earlier.values));
      previous.delete(id);

      return Promise.resolve(true);
    },
    change: (id, changes) => {
      const was = installed.get(id);

      if (was === undefined) {
        return Promise.resolve(false);
      }

      installed.set(id, { ...was, ...changes, updatedAt: now().toISOString() });

      return Promise.resolve(true);
    },
    remove: (id) => {
      const had = installed.delete(id);

      values.delete(id);
      previous.delete(id);
      hooks.delete(id);
      profiles.delete(id);

      for (const [key, connection] of connections) {
        if (connection.pluginId === id) {
          connections.delete(key);
        }
      }

      return Promise.resolve(had);
    },
    readValue: (pluginId, key) => Promise.resolve(kept(pluginId).get(key)?.value ?? null),
    writeValue: (pluginId, key, value, bytes) => {
      kept(pluginId).set(key, { value, bytes });

      return Promise.resolve();
    },
    forgetValue: (pluginId, key) => {
      kept(pluginId).delete(key);

      return Promise.resolve();
    },
    listKeys: (pluginId, prefix) =>
      Promise.resolve([...kept(pluginId).keys()].filter((key) => key.startsWith(prefix)).sort()),
    bytesKept: (pluginId, except) =>
      Promise.resolve(
        [...kept(pluginId)].reduce(
          (sum, [key, entry]) => (key === except ? sum : sum + entry.bytes),
          0,
        ),
      ),
    readConnection: (pluginId, profileId, provider) =>
      Promise.resolve(connections.get(connectionKey(pluginId, profileId, provider)) ?? null),
    connectionsOf: (pluginId) =>
      Promise.resolve(
        [...connections.values()].filter((connection) => connection.pluginId === pluginId),
      ),
    saveConnection: (connection) => {
      connections.set(
        connectionKey(connection.pluginId, connection.profileId, connection.provider),
        connection,
      );

      return Promise.resolve();
    },
    forgetConnection: (pluginId, profileId, provider) =>
      Promise.resolve(connections.delete(connectionKey(pluginId, profileId, provider))),
    rememberProfile: (pluginId, profileId) => {
      const known = profiles.get(pluginId) ?? new Set<string>();

      known.add(profileId);
      profiles.set(pluginId, known);

      return Promise.resolve();
    },
    profilesOf: (pluginId) => {
      const known = new Set(profiles.get(pluginId) ?? []);

      for (const connection of connections.values()) {
        if (connection.pluginId === pluginId) {
          known.add(connection.profileId);
        }
      }

      return Promise.resolve([...known].sort());
    },
  };
};

export { createMemoryPluginStore };
