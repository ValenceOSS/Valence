import type { SignedBundle } from '@ValenceDesktop/build/SignedBundle';
import type { UpdateManifest } from '@ValenceDesktop/build/UpdateManifest';

type Release = {
  version: string;
  notes: string;
  publishedAt: Date;
  downloads: string;
};

/**
 * Writes the manifest the desktop app's updater reads to find a release: its version, and for each
 * platform the bundle to download and the signature it has to match.
 *
 * @param release - The release, with the address its files are downloaded from.
 * @param bundles - Each platform's bundle and its signature.
 */
const anUpdateManifest = (release: Release, bundles: SignedBundle[]): UpdateManifest => ({
  version: release.version,
  notes: release.notes,
  pub_date: release.publishedAt.toISOString(),
  platforms: Object.fromEntries(
    bundles.map(({ platform, file, signature }) => [
      platform,
      {
        signature: signature.trim(),
        url: `${release.downloads.replace(/\/+$/u, '')}/${encodeURIComponent(file)}`,
      },
    ]),
  ),
});

export { anUpdateManifest };
