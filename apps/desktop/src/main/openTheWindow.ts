import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';

const WIDTH = 1280;

const HEIGHT = 800;

const MINIMUM_WIDTH = 880;

const MINIMUM_HEIGHT = 560;

const IS_MAC = process.platform === 'darwin';

const CONTROLS = { color: '#00000000', symbolColor: '#ffffff', height: 32 };

/**
 * Opens the one window this client is, and puts the application in it.
 *
 * `nodeIntegration` off and `contextIsolation` on, which is what keeps the page a page: everything
 * it can do to the machine is the short list the preload script hands it, rather than everything
 * Node can do. A media client loads artwork and subtitles from a server somebody else runs, so this
 * is not a formality.
 *
 * The frame is hidden so the window reads as an application rather than as a browser. On macOS the
 * traffic lights are inset to clear the bar the application draws along its top. Elsewhere there is
 * no menu bar, and the system's own minimise, maximise and close are laid over the top right of the
 * page, drawn clear so the header shows through behind them.
 *
 * The developer tools are shut in an installed build, shortcut and menu alike. Leaving only the menu
 * item out would leave `F12` and `Ctrl+Shift+I` opening them, so the window refuses them itself.
 *
 * The icon is given for the platforms that take one from the window. macOS takes its from the bundle
 * instead, which the packaging config points at the same file.
 *
 * A page asking for a new window is a link somewhere outside Valence, such as its documentation,
 * and goes to the system's own browser rather than to a bare window of this one.
 *
 * @returns The window.
 */
const openTheWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    icon: join(app.getAppPath(), 'build/icon.png'),
    width: WIDTH,
    height: HEIGHT,
    minWidth: MINIMUM_WIDTH,
    minHeight: MINIMUM_HEIGHT,
    show: false,
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'hidden',
    ...(IS_MAC ? {} : { titleBarOverlay: CONTROLS }),
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: !app.isPackaged,
      preload: join(app.getAppPath(), 'dist-preload/preload/Preload.js'),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//u.test(url)) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
};

export { openTheWindow };
