import { Menu, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { say } from '@ValenceI18n/say';

const IS_MAC = process.platform === 'darwin';

// eslint-disable-next-line valence/no-hard-coded-strings -- a keyboard shortcut in Electron's notation
const CHANGE_SERVER_KEYS = 'CmdOrCtrl+Shift+S';

/**
 * Builds the menu, whose one unusual item is the way back to choosing a server.
 *
 * Everything else is the menu any application has, and it is here because setting a menu at all
 * replaces the one Electron provides — so leaving it out would take copy and paste with it.
 *
 * Changing server has to be a menu item rather than a button on a screen. Once the window is showing
 * the server's own pages there is no screen of ours left to put it on, and the server's Valence has no
 * idea it is being looked at through a window that could be pointed somewhere else. A menu is the
 * part of a desktop application that belongs to the application rather than to what it is showing,
 * which is exactly what this is.
 *
 * It is under File on every platform, and on the application menu as well where there is one. The
 * application menu takes its name from the bundle rather than from anything here, so somebody
 * looking for Valence may be reading a menu called something else — and somebody who cannot find the
 * thing that points this window at their server has an application that does nothing.
 *
 * The developer tools are offered only where asked for, which is a build being worked on and never an
 * installed one. They open the page's own scripts and storage to whoever is at the keyboard, which is
 * what a person debugging wants and not what somebody watching a film needs in their View menu.
 *
 * @param changeServer - What to do when somebody asks for a different one.
 * @param hasDevTools - Whether to offer the developer tools, which an installed build does not.
 * @returns The menu, already set.
 */
const theApplicationMenu = (changeServer: () => void, hasDevTools = false): Menu => {
  const valence: MenuItemConstructorOptions = {
    label: say('common.valence'),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        label: say('desktop.theApplicationMenu.changeServer'),
        accelerator: CHANGE_SERVER_KEYS,
        click: changeServer,
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  };

  const file: MenuItemConstructorOptions = {
    label: say('desktop.theApplicationMenu.file'),
    submenu: [
      {
        label: say('desktop.theApplicationMenu.changeServer'),
        accelerator: CHANGE_SERVER_KEYS,
        click: changeServer,
      },
      ...(IS_MAC ? [] : [{ type: 'separator' } as const, { role: 'quit' } as const]),
    ],
  };

  const menu = Menu.buildFromTemplate([
    ...(IS_MAC ? [valence] : []),
    file,
    { role: 'editMenu' },
    {
      label: say('desktop.theApplicationMenu.view'),
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(hasDevTools ? [{ role: 'toggleDevTools' } as const] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: say('desktop.theApplicationMenu.onTheWeb'),
          click: () => {
            void shell.openExternal('https://github.com/MarquesCoding/Valence');
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);

  return menu;
};

export { theApplicationMenu };
