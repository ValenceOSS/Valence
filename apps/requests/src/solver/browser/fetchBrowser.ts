import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getPath, installedVerStr, unzip } from 'camoufox-js/dist/pkgman.js';
import { z } from 'zod';
import { PinnedCamoufoxFetcher } from './PinnedCamoufoxFetcher';
import { downloadVerified } from './downloadVerified';
import { pinnedBrowser } from './pinnedBrowser';

const AddonManifestSchema = z.object({ version: z.string() });

const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

/**
 * Reads which Camoufox release is installed, if any.
 *
 * @returns The installed release, as camoufox-js spells it, or null when there is none.
 */
const installedCamoufox = (): string | null => {
  try {
    return installedVerStr();
  } catch {
    return null;
  }
};

/**
 * Reads which uBlock Origin is unpacked in an addon folder, if any.
 *
 * @param folder - Where camoufox-js keeps the addon.
 * @returns The installed version, or null when there is none or its manifest cannot be read, so a
 *   broken install is replaced rather than failing every run.
 */
const installedUblockOrigin = (folder: string): string | null => {
  const manifest = join(folder, 'manifest.json');

  if (!existsSync(manifest)) {
    return null;
  }

  try {
    return (
      AddonManifestSchema.safeParse(JSON.parse(readFileSync(manifest, 'utf8'))).data?.version ??
      null
    );
  } catch {
    return null;
  }
};

const pin = pinnedBrowser(readFileSync(new URL('../../../Dockerfile', import.meta.url), 'utf8'));

const camoufox = `${pin.camoufoxVersion}-${pin.camoufoxRelease}`;

if (installedCamoufox() === camoufox) {
  say(`Camoufox ${camoufox} is installed.`);
} else {
  say(`Installing Camoufox ${camoufox}, the release the requests image ships.`);
  await new PinnedCamoufoxFetcher(pin.camoufoxVersion, pin.camoufoxRelease).install();
}

const ublockOrigin = getPath(join('addons', 'UBO'));

if (installedUblockOrigin(ublockOrigin) === pin.ublockOriginVersion) {
  say(`uBlock Origin ${pin.ublockOriginVersion} is installed.`);
} else {
  say(`Installing uBlock Origin ${pin.ublockOriginVersion}, the build the requests image ships.`);
  const xpi = await downloadVerified(pin.ublockOriginUrl, pin.ublockOriginSha256);

  rmSync(ublockOrigin, { recursive: true, force: true });
  await unzip(xpi, ublockOrigin, undefined, false);

  if (installedUblockOrigin(ublockOrigin) !== pin.ublockOriginVersion) {
    throw new Error(`uBlock Origin ${pin.ublockOriginVersion} could not be installed.`);
  }
}
