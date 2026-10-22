import { KEEP_THE_SCREEN_ON } from '@ValenceDesktop/main/screenChannels';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type ScreenBlocker = {
  start: (type: 'prevent-display-sleep') => number;
  stop: (id: number) => boolean;
};

type ScreenWindow = {
  on: (event: 'closed', listener: () => void) => void;
  webContents: {
    on: (event: 'did-start-navigation', listener: () => void) => void;
    ipc: {
      on: (channel: string, listener: (event: object, isOn: JsonValue) => void) => void;
    };
  };
};

/**
 * Keeps the screen on while the window's page says something is playing, and lets it sleep again
 * once the page says it has stopped, the page goes somewhere else, or the window closes. A browser
 * holds the screen on only for a page served over a secure address, and a server on a home network
 * is often not one, so the window does it for the page itself.
 *
 * @param window - The window to answer for.
 * @param blocker - What holds the screen on, which is Electron's power save blocker.
 */
const answerAboutTheScreen = (window: ScreenWindow, blocker: ScreenBlocker): void => {
  let held: number | null = null;

  const letGo = (): void => {
    if (held !== null) {
      blocker.stop(held);
      held = null;
    }
  };

  window.webContents.ipc.on(KEEP_THE_SCREEN_ON, (_event, isOn) => {
    if (isOn !== true) {
      letGo();

      return;
    }

    held ??= blocker.start('prevent-display-sleep');
  });

  window.webContents.on('did-start-navigation', letGo);
  window.on('closed', letGo);
};

export { answerAboutTheScreen };
