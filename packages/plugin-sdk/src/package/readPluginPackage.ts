import { gunzipSync } from 'node:zlib';
import type { PluginPackage } from './PluginPackageSchema';
import { PACKAGE_LIMITS } from './PACKAGE_LIMITS';
import { PluginPackageSchema } from './PluginPackageSchema';

/**
 * Opens a `.vplugin` file, refusing one too large to be a plugin before or after it is unpacked,
 * and one whose contents break the package rules.
 *
 * @param bytes - The file as it arrived.
 * @returns The package, or a sentence saying why it was refused.
 */
const readPluginPackage = (
  bytes: Uint8Array,
): { ok: true; plugin: PluginPackage } | { ok: false; problem: string } => {
  if (bytes.byteLength > PACKAGE_LIMITS.packageBytes) {
    return { ok: false, problem: 'The package is larger than 8 MB.' };
  }

  let text: string;

  try {
    text = gunzipSync(bytes, { maxOutputLength: PACKAGE_LIMITS.packageBytes * 2 }).toString('utf8');
  } catch {
    return { ok: false, problem: 'The package is not a gzipped Valence plugin.' };
  }

  let read: ReturnType<typeof PluginPackageSchema.safeParse>;

  try {
    read = PluginPackageSchema.safeParse(JSON.parse(text));
  } catch {
    return { ok: false, problem: 'The package does not hold JSON.' };
  }

  return read.success
    ? { ok: true, plugin: read.data }
    : { ok: false, problem: read.error.issues.map((issue) => issue.message).join(' ') };
};

export { readPluginPackage };
