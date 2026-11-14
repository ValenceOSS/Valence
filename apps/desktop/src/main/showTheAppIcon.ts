import { join } from 'node:path';
import { app, nativeImage, nativeTheme } from 'electron';
import type { BrowserWindow } from 'electron';
import { appIconFile } from '@ValenceDesktop/main/appIconFile';

/**
 * Shows Valence on the Windows taskbar with the round icon chosen on this computer, light or dark or
 * following the system. Other systems take their icon from the app itself, so nothing changes there.
 *
 * @param window - The window whose taskbar button carries it.
 * @param chosen - The kept choice, or nothing to follow the system.
 */
const showTheAppIcon = (
  window: Pick<BrowserWindow, 'isDestroyed' | 'setIcon'> | null,
  chosen: string | null,
): void => {
  if (process.platform !== 'win32' || window === null || window.isDestroyed()) {
    return;
  }

  window.setIcon(
    nativeImage.createFromPath(
      join(app.getAppPath(), appIconFile(chosen, nativeTheme.shouldUseDarkColors)),
    ),
  );
};

export { showTheAppIcon };
