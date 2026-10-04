import { CamoufoxFetcher, OS_NAME } from 'camoufox-js/dist/pkgman.js';

class PinnedCamoufoxFetcher extends CamoufoxFetcher {
  private readonly pinnedVersion: string;

  private readonly pinnedRelease: string;

  constructor(version: string, release: string) {
    super();
    this.pinnedVersion = version;
    this.pinnedRelease = release;
  }

  /**
   * Points camoufox-js's own installer at the pinned release's build for this machine, rather than
   * the newest release it can find, so it downloads, unpacks and records the browser as
   * `camoufox-js fetch` does.
   *
   * @returns Once the installer knows what to download.
   * @throws If camoufox-js would not run the pinned release.
   */
  override fetchLatest(): Promise<void> {
    const tag = `${this.pinnedVersion}-${this.pinnedRelease}`;
    const name = `camoufox-${tag}-${OS_NAME}.${this.arch}.zip`;
    const found = this.checkAsset({
      name,
      browser_download_url: `https://github.com/daijro/camoufox/releases/download/v${tag}/${name}`,
    });

    if (found === null) {
      return Promise.reject(new Error(`camoufox-js does not support Camoufox ${tag}.`));
    }

    [this._version_obj, this._url] = found;

    return Promise.resolve();
  }
}

export { PinnedCamoufoxFetcher };
