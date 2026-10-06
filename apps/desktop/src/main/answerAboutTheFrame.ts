import type { WindowFrame } from '@ValenceContracts/schemas/WindowFrame';
import {
  CLOSE_THE_WINDOW,
  FRAME_CHANGED,
  MAXIMISE_THE_WINDOW,
  MINIMISE_THE_WINDOW,
  WHAT_THE_FRAME_IS,
} from '@ValenceDesktop/main/windowChannels';

type FramedWindow = {
  isMaximized: () => boolean;
  isFullScreen: () => boolean;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
  on: ((event: 'maximize', listener: () => void) => void) &
    ((event: 'unmaximize', listener: () => void) => void) &
    ((event: 'enter-full-screen', listener: () => void) => void) &
    ((event: 'leave-full-screen', listener: () => void) => void);
  webContents: {
    send: (channel: string, frame: WindowFrame) => void;
    ipc: {
      on: (channel: string, listener: (event: { returnValue: WindowFrame }) => void) => void;
    };
  };
};

/**
 * Lets the page minimise, maximise, restore and close the window it is in, and tells it whenever
 * the window is maximised, restored, or taken in or out of full screen, so the controls it draws
 * for them always say what pressing them would do.
 *
 * Asked of the window's own page alone, so a second window, should there ever be one, answers for
 * itself rather than for whichever window opened first.
 *
 * @param window - The window to answer for.
 */
const answerAboutTheFrame = (window: FramedWindow): void => {
  const theFrame = (): WindowFrame => ({
    isMaximised: window.isMaximized(),
    isFullScreen: window.isFullScreen(),
  });

  const tell = (): void => {
    window.webContents.send(FRAME_CHANGED, theFrame());
  };

  window.webContents.ipc.on(WHAT_THE_FRAME_IS, (event) => {
    event.returnValue = theFrame();
  });

  window.webContents.ipc.on(MINIMISE_THE_WINDOW, () => {
    window.minimize();
  });

  window.webContents.ipc.on(MAXIMISE_THE_WINDOW, () => {
    if (window.isMaximized()) {
      window.unmaximize();

      return;
    }

    window.maximize();
  });

  window.webContents.ipc.on(CLOSE_THE_WINDOW, () => {
    window.close();
  });

  window.on('maximize', tell);
  window.on('unmaximize', tell);
  window.on('enter-full-screen', tell);
  window.on('leave-full-screen', tell);
};

export { answerAboutTheFrame };
