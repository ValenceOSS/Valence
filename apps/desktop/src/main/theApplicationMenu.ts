import { Menu, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { say } from '@ValenceI18n/say';

type ApplicationMenuNeeds = {
  changeServer: () => void;
  hasDevTools?: boolean;
  checkForUpdates?: () => void;
  platform?: NodeJS.Platform;
};

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
 * Checking for updates sits under About on the Mac, where a Mac application keeps it, and only in a
 * build that updates itself. Windows and Linux have no menu bar to show, and keep it in the tray.
 *
 * @param needs - What to do when somebody asks for a different server; whether to offer the
 *   developer tools, which an installed build does not; what to do when somebody asks for a release
 *   now, where this build can update itself; and which system this is.
 * @returns The menu, already set.
 */
const theApplicationMenu = ({
  changeServer,
  hasDevTools = false,
  checkForUpdates,
  platform = process.platform,
}: ApplicationMenuNeeds): Menu => {
  const isMac = platform === 'darwin';
  const valence: MenuItemConstructorOptions = {
    label: say('common.valence'),
    submenu: [
      { role: 'about' },
      ...(checkForUpdates === undefined
        ? []
        : [{ label: say('common.checkForUpdates'), click: checkForUpdates }]),
      { type: 'separator' },
      {
        label: say('common.changeServer'),
        accelerator: say('desktop.main.theApplicationMenu.cmdOrCtrlShiftS'),
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
    label: say('desktop.main.theApplicationMenu.file'),
    submenu: [
      {
        label: say('common.changeServer'),
        accelerator: say('desktop.main.theApplicationMenu.cmdOrCtrlShiftS'),
        click: changeServer,
      },
      ...(isMac ? [] : [{ type: 'separator' } as const, { role: 'quit' } as const]),
    ],
  };

  const menu = Menu.buildFromTemplate([
    ...(isMac ? [valence] : []),
    file,
    { role: 'editMenu' },
    {
      label: say('common.view'),
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
          label: say('desktop.main.theApplicationMenu.valenceOnTheWeb'),
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
