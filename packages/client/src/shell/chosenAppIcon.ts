import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { APP_ICON_KEY } from './APP_ICON_KEY';
import { AppIconSchema } from './AppIconSchema';
import type { AppIcon } from './AppIconSchema';

/**
 * Which icon this computer shows Valence with: following the system's light or dark mode, or one
 * chosen outright.
 *
 * @returns What was chosen.
 */
const chosenAppIcon = (): AppIcon => AppIconSchema.parse(platformInUse().store.read(APP_ICON_KEY));

export { chosenAppIcon };
