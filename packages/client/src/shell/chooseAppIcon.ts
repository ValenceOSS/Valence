import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { APP_ICON_KEY } from './APP_ICON_KEY';
import type { AppIcon } from './AppIconSchema';

/**
 * Keeps which icon this computer shows Valence with; following the system is kept as no choice at
 * all, so a later default reaches it.
 *
 * @param icon - What was chosen.
 */
const chooseAppIcon = (icon: AppIcon): void => {
  const { store } = platformInUse();

  if (icon === 'system') {
    store.forget(APP_ICON_KEY);
  } else {
    store.write(APP_ICON_KEY, icon);
  }
};

export { chooseAppIcon };
