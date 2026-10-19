import { app, BrowserWindow, screen } from 'electron';
import type { Rectangle } from 'electron';
import { join } from 'node:path';
import { ORIGIN } from '@ValenceDesktop/main/serveTheApplication';

const WIDTH = 300;

const HEIGHT = 340;

/**
 * Opens the small window that stands in for the main one while an update installs, and waits until
 * it is on screen.
 *
 * Framed by nothing and fixed in size, since there is nothing in it to resize or close: it lasts as
 * long as the install does and goes when this process does. It sits in the true middle of the screen
 * the main window was on, or the main screen where there is no main window yet, worked out here
 * rather than left to the system, since macOS centres a window a third of the way down instead. It is held back until its page has
 * drawn, so it never arrives blank, and the promise settles only then — whoever is about to take
 * the main window away waits for this one to be showing first.
 *
 * @param step - Whether this process is about to quit for the installer, or has just been installed.
 * @param version - The version being installed.
 * @param over - Where the main window is, to open on the same screen, if there is one.
 * @returns The window, once it is showing.
 */
const openTheUpdateWindow = async (
  step: 'installing' | 'finishing',
  version: string,
  over?: Rectangle,
): Promise<BrowserWindow> => {
  const { workArea } =
    over === undefined ? screen.getPrimaryDisplay() : screen.getDisplayMatching(over);

  const window = new BrowserWindow({
    icon: join(app.getAppPath(), 'build/icon.png'),
    width: WIDTH,
    height: HEIGHT,
    x: workArea.x + Math.round((workArea.width - WIDTH) / 2),
    y: workArea.y + Math.round((workArea.height - HEIGHT) / 2),
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: !app.isPackaged,
      preload: join(app.getAppPath(), 'dist-preload/Preload.mjs'),
    },
  });

  const shown = new Promise<void>((resolve) => {
    window.once('ready-to-show', () => {
      window.show();
      resolve();
    });
  });

  await window.loadURL(
    `${ORIGIN}/update.html?${new URLSearchParams({ step, version }).toString()}`,
  );
  await shown;

  return window;
};

export { openTheUpdateWindow };
