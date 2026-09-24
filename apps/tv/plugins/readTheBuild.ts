import { commitBuiltFrom } from '@valence/core/src/functions/commitBuiltFrom.ts';
import { releaseVersion } from '@valence/core/src/functions/releaseVersion.ts';

/**
 * Which release of Valence this is and the commit it is built from, read once from the checkout
 * doing the building, since an installed app carries neither the release manifest nor a `.git`.
 *
 * @returns The release, from the repository's release manifest, and a short commit hash, each
 *   `unknown` where the checkout has none to give.
 */
const readTheBuild = (): { version: string; commit: string } => ({
  version: releaseVersion(),
  commit: commitBuiltFrom(),
});

export { readTheBuild };
