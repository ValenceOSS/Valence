import { z } from 'zod';

const UNKNOWN_VERSION = '0.0.0';

const ManifestSchema = z.object({ '.': z.string().min(1) });

type VersionSources = {
  fromEnvironment: string;
  readManifest: () => string;
};

/**
 * Says which version this server is: the one its image was built with, or, for a checkout run
 * directly where nothing set it, the release the checkout's release manifest names.
 *
 * @param sources - The version the environment holds, and how to read the release manifest.
 * @returns The version, or 0.0.0 where neither says.
 */
const readServerVersion = ({ fromEnvironment, readManifest }: VersionSources): string => {
  const given = fromEnvironment.trim();

  if (given !== '' && given !== UNKNOWN_VERSION) {
    return given;
  }

  try {
    return ManifestSchema.parse(JSON.parse(readManifest()))['.'];
  } catch {
    return UNKNOWN_VERSION;
  }
};

export { readServerVersion };
