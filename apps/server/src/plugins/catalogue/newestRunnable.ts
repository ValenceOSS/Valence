import { compareVersions } from '@ValenceSDK/package/compareVersions';
import { satisfiesApiRange } from '@ValenceServer/plugins/install/satisfiesApiRange';
import type { CatalogueEntry } from '@ValenceSDK/package/CatalogueSchema';

/**
 * The newest version of a catalogue entry this server's plugin API runs: the entry itself where it
 * can, and otherwise the newest of the earlier versions listed under it.
 *
 * @param entry - The plugin as the catalogue lists it.
 * @param apiVersion - The plugin API this server offers.
 * @returns The entry as that version, or nothing where no version runs here.
 */
const newestRunnable = (entry: CatalogueEntry, apiVersion: string): CatalogueEntry | null => {
  const chosen = [entry, ...entry.earlier]
    .filter((version) => satisfiesApiRange(version.apiVersion, apiVersion))
    .toSorted((first, second) => compareVersions(second.version, first.version))[0];

  return chosen === undefined
    ? null
    : {
        ...entry,
        version: chosen.version,
        apiVersion: chosen.apiVersion,
        permissions: chosen.permissions,
        packageUrl: chosen.packageUrl,
        sha256: chosen.sha256,
        signature: chosen.signature,
        keyId: chosen.keyId,
        publishedAt: chosen.publishedAt,
      };
};

export { newestRunnable };
