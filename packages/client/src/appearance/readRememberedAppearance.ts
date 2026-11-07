import { AppearanceSchema } from '@ValenceContracts/schemas/Roundness';
import type { Appearance } from '@ValenceContracts/schemas/Roundness';
import { APPEARANCE_KEPT_AS } from '@ValenceClient/appearance/APPEARANCE_KEPT_AS';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * How this Valence looked the last time this device asked, so its own name and logo can be shown
 * from the first frame rather than Valence's until the server answers again.
 *
 * @returns What was kept, or nothing where nothing was, or it no longer reads.
 */
const readRememberedAppearance = (): Appearance | undefined => {
  try {
    const held = platformInUse().store.read(APPEARANCE_KEPT_AS);
    const read = held === null ? null : AppearanceSchema.safeParse(JSON.parse(held));

    return read?.success === true ? read.data : undefined;
  } catch {
    return undefined;
  }
};

export { readRememberedAppearance };
