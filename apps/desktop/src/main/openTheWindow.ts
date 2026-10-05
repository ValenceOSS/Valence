import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { aServerPageFor } from '@ValenceDesktop/main/aServerPageFor';
import { opensOutside } from '@ValenceDesktop/main/opensOutside';
import { staysInTheApplication } from '@ValenceDesktop/main/staysInTheApplication';
import { theServerAddress } from '@ValenceDesktop/main/theServerAddress';

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
 * A page of the server's own that the window is sent to, such as where a plugin connects somebody's
 * account elsewhere, opens in their browser too, since it may go on to another site this window
 * cannot follow.
 *
 * Anywhere else the window is sent is refused, and a web page among them opens in the browser
 * instead, so the window only ever holds the application and the preload script is only ever
 * handed to it.
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
      preload: join(app.getAppPath(), 'dist-preload/Preload.mjs'),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (opensOutside(url)) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    const page = aServerPageFor(url, theServerAddress());

    if (page !== null) {
      event.preventDefault();
      void shell.openExternal(page);

      return;
    }

    if (!staysInTheApplication(url)) {
      event.preventDefault();

      if (opensOutside(url)) {
        void shell.openExternal(url);
      }
    }
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
};

export { openTheWindow };
