import type { Said } from '@ValenceI18n/SaidSchema';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { PACKAGE_LIMITS } from '@ValenceSDK/package/PACKAGE_LIMITS';
import type { Catalogue, CatalogueEntry } from '@ValenceSDK/package/CatalogueSchema';
import { isSignedBy } from '@ValenceSDK/package/isSignedBy';
import { readSignedCatalogue } from '@ValenceSDK/package/readSignedCatalogue';
import { saying } from '@ValenceI18n/saying';

type Download = (url: string, mostBytes: number) => Promise<Uint8Array | null>;

type CreateCatalogueClientOptions = {
  url: string;
  download: Download;
  keys: Readonly<Record<string, string>>;
  now?: () => number;
};

type CatalogueRead = { catalogue: Catalogue | null; problem: Said | null };

const KEPT_FOR_MILLISECONDS = 10 * 60 * 1000;

const MOST_CATALOGUE_BYTES = 2 * 1024 * 1024;

/**
 * Reads the official plugin catalogue and the packages it lists, believing nothing it has not
 * checked. The catalogue must carry a signature from one of the keys the server was built with; a
 * package must hash to what the catalogue says and carry a signature from the key it names. A
 * catalogue that cannot be reached or checked is reported as such, never used unchecked.
 *
 * Kept for ten minutes after a good read, so an administrator browsing it is not a fetch a click.
 *
 * @param options - Where the catalogue is, how to download, and the trusted keys.
 * @returns How to read the catalogue and fetch a package from it.
 */
const createCatalogueClient = ({
  url,
  download,
  keys,
  now = Date.now,
}: CreateCatalogueClientOptions) => {
  let kept: { read: CatalogueRead; until: number } | null = null;

  const read = async (): Promise<CatalogueRead> => {
    if (kept !== null && kept.until > now()) {
      return kept.read;
    }

    const [bytes, signatureBytes] = await Promise.all([
      download(url, MOST_CATALOGUE_BYTES),
      download(`${url}.sig`, 4096),
    ]);

    if (bytes === null || signatureBytes === null) {
      return { catalogue: null, problem: saying('common.thePluginCatalogueCouldNotBe') };
    }

    const opened = readSignedCatalogue(bytes, Buffer.from(signatureBytes).toString('utf8'), keys);

    if ('problem' in opened) {
      return {
        catalogue: null,
        problem:
          opened.problem === 'unsigned'
            ? saying('server.catalogue.catalogueClient.thePluginCatalogueIsNotSigned')
            : saying('server.catalogue.catalogueClient.thePluginCatalogueCouldNotBe'),
      };
    }

    const good = { catalogue: opened.catalogue, problem: null };

    kept = { read: good, until: now() + KEPT_FOR_MILLISECONDS };

    return good;
  };

  const fetchPackage = async (
    entry: CatalogueEntry,
  ): Promise<{ bytes: Uint8Array } | { problem: Said }> => {
    const bytes = await download(entry.packageUrl, PACKAGE_LIMITS.packageBytes);

    if (bytes === null) {
      return {
        problem: saying('server.catalogue.catalogueClient.nameCouldNotBeDownloaded', {
          name: entry.name,
        }),
      };
    }

    if (sha256Of(bytes) !== entry.sha256) {
      return {
        problem: saying('server.catalogue.catalogueClient.nameIsNotThePackageThe', {
          name: entry.name,
        }),
      };
    }

    if (isSignedBy(bytes, { keyId: entry.keyId, signature: entry.signature }, keys) === null) {
      return {
        problem: saying('server.catalogue.catalogueClient.nameIsNotSignedByThe', {
          name: entry.name,
        }),
      };
    }

    return { bytes };
  };

  return { read, fetchPackage };
};

type CatalogueClient = ReturnType<typeof createCatalogueClient>;

export type { CatalogueClient, Download };

export { createCatalogueClient };
