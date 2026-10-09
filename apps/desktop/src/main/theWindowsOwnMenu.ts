type RightClickedWindow = {
  webContents: {
    on: (event: 'context-menu', listener: (event: { preventDefault: () => void }) => void) => void;
  };
};

/**
 * Keeps a right click to the application, with no menu of the window's own.
 *
 * A right click on a page the server drew used to raise a menu of reload and the developer tools,
 * which is a browser showing through rather than an application. Changing server stays in the
 * application menu and on its shortcut, and the developer tools stay on theirs in a build being
 * worked on.
 *
 * @param window - The window to answer a right click in.
 */
const theWindowsOwnMenu = (window: RightClickedWindow): void => {
  window.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
};

export { theWindowsOwnMenu };
