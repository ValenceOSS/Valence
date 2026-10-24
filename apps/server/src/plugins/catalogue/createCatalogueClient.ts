import type { Said } from '@ValenceI18n/SaidSchema';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { PACKAGE_LIMITS } from '@ValenceSDK/package/PACKAGE_LIMITS';
import type { Catalogue, CatalogueEntry } from '@ValenceSDK/package/CatalogueSchema';
import { isSignedBy } from '@ValenceSDK/package/isSignedBy';
import { readSignedCatalogue } from '@ValenceSDK/package/readSignedCatalogue';
import { catalogueSignedBy } from '@ValenceSDK/package/catalogueSignedBy';
import { saying } from '@ValenceI18n/saying';

type Download = (url: string, mostBytes: number) => Promise<Uint8Array | null>;

type Keys = Readonly<Record<string, string>>;

type CreateCatalogueClientOptions = {
  url: string;
  download: Download;
  keys: Keys;
  trustedKeys?: () => Promise<Keys>;
  now?: () => number;
};

type SignedBy = 'official' | 'trusted';

type CatalogueRead = {
  catalogue: Catalogue | null;
  problem: Said | null;
  signedBy: SignedBy | null;
};

const KEPT_FOR_MILLISECONDS = 10 * 60 * 1000;

const MOST_CATALOGUE_BYTES = 2 * 1024 * 1024;

/**
 * Reads the plugin catalogue and the packages it lists, believing nothing it has not checked. The
 * catalogue must carry a signature from one of the keys the server was built with, or from one the
 * operator trusts; a package must hash to what the catalogue says and carry a signature from the
 * key it names. Either is said to be official only where an official key signed it. A catalogue
 * that cannot be reached or checked is reported as such, never used unchecked.
 *
 * Kept for ten minutes after a good read, so an administrator browsing it is not a fetch a click,
 * unless the keys the operator trusts change meanwhile.
 *
 * @param options - Where the catalogue is, how to download, the official keys, and the operator's.
 * @returns How to read the catalogue and fetch a package from it.
 */
const createCatalogueClient = ({
  url,
  download,
  keys,
  trustedKeys = () => Promise.resolve({}),
  now = Date.now,
}: CreateCatalogueClientOptions) => {
  let kept: { read: CatalogueRead; until: number; keys: string } | null = null;

  const everyKey = async (): Promise<{ all: Keys; fingerprint: string }> => {
    const theirs = await trustedKeys();
    const all = { ...theirs, ...keys };

    return { all, fingerprint: JSON.stringify(Object.entries(theirs).toSorted()) };
  };

  const kindOf = (keyId: string): SignedBy => (Object.hasOwn(keys, keyId) ? 'official' : 'trusted');

  const read = async (): Promise<CatalogueRead> => {
    const { all, fingerprint } = await everyKey();

    if (kept !== null && kept.until > now() && kept.keys === fingerprint) {
      return kept.read;
    }

    const [bytes, signatureBytes] = await Promise.all([
      download(url, MOST_CATALOGUE_BYTES),
      download(`${url}.sig`, 4096),
    ]);

    if (bytes === null || signatureBytes === null) {
      return {
        catalogue: null,
        problem: saying('common.thePluginCatalogueCouldNotBe'),
        signedBy: null,
      };
    }

    const signatureText = Buffer.from(signatureBytes).toString('utf8');
    const opened = readSignedCatalogue(bytes, signatureText, all);
    const signer = catalogueSignedBy(bytes, signatureText, all);

    if ('problem' in opened || signer === null) {
      return {
        catalogue: null,
        signedBy: null,
        problem:
          'problem' in opened && opened.problem === 'unreadable'
            ? saying('server.catalogue.catalogueClient.thePluginCatalogueCouldNotBe')
            : saying('server.catalogue.catalogueClient.thePluginCatalogueIsNotSigned'),
      };
    }

    const good = { catalogue: opened.catalogue, problem: null, signedBy: kindOf(signer) };

    kept = { read: good, until: now() + KEPT_FOR_MILLISECONDS, keys: fingerprint };

    return good;
  };

  const fetchPackage = async (
    entry: CatalogueEntry,
  ): Promise<{ bytes: Uint8Array; signedBy: SignedBy } | { problem: Said }> => {
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

    const signer = isSignedBy(
      bytes,
      { keyId: entry.keyId, signature: entry.signature },
      (await everyKey()).all,
    );

    if (signer === null) {
      return {
        problem: saying('server.catalogue.catalogueClient.nameIsNotSignedByThe', {
          name: entry.name,
        }),
      };
    }

    return { bytes, signedBy: kindOf(signer) };
  };

  return { read, fetchPackage };
};

type CatalogueClient = ReturnType<typeof createCatalogueClient>;

export type { CatalogueClient, Download, SignedBy };

export { createCatalogueClient };
