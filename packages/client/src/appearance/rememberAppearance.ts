import type { Appearance } from '@ValenceContracts/schemas/Roundness';
import { APPEARANCE_KEPT_AS } from '@ValenceClient/appearance/APPEARANCE_KEPT_AS';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Keeps how this Valence looks on the device, for the next time it opens.
 *
 * @param appearance - What the server said.
 * @returns The same appearance, so it can be passed straight on.
 */
const rememberAppearance = (appearance: Appearance): Appearance => {
  try {
    platformInUse().store.write(APPEARANCE_KEPT_AS, JSON.stringify(appearance));
  } catch {
    return appearance;
  }

  return appearance;
};

export { rememberAppearance };
