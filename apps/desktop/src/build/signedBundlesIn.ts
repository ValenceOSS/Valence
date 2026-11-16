import type { UpdatePlatform } from '@ValenceDesktop/build/UpdatePlatform';
import { updatePlatformOf } from '@ValenceDesktop/build/updatePlatformOf';

type SignedFile = { platform: UpdatePlatform; file: string; signatureFile: string };

/**
 * Picks out of a folder's files each one an updater installs and the signature beside it.
 *
 * @param files - The names of the files in the folder.
 * @returns Each signed bundle, and the name of each bundle that has no signature beside it.
 */
const signedBundlesIn = (files: string[]): { signed: SignedFile[]; unsigned: string[] } => {
  const present = new Set(files);
  const bundles = files.flatMap((file) => {
    const platform = updatePlatformOf(file);

    return platform === undefined ? [] : [{ platform, file, signatureFile: `${file}.sig` }];
  });

  return {
    signed: bundles.filter(({ signatureFile }) => present.has(signatureFile)),
    unsigned: bundles
      .filter(({ signatureFile }) => !present.has(signatureFile))
      .map(({ file }) => file),
  };
};

export { signedBundlesIn };
