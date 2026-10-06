import { describe, expect, it, vi } from 'vitest';
import type { WindowFrame } from '@ValenceContracts/schemas/WindowFrame';
import { answerAboutTheFrame } from './answerAboutTheFrame';
import {
  CLOSE_THE_WINDOW,
  FRAME_CHANGED,
  MAXIMISE_THE_WINDOW,
  MINIMISE_THE_WINDOW,
  WHAT_THE_FRAME_IS,
} from './windowChannels';

type Asking = { returnValue: WindowFrame };

const aWindow = (isMaximised = false) => {
  const asked = new Map<string, (event: Asking) => void>();
  const changes = new Map<string, () => void>();
  const state = { isMaximised, isFullScreen: false };

  const window = {
    isMaximized: () => state.isMaximised,
    isFullScreen: () => state.isFullScreen,
    minimize: vi.fn(),
    maximize: vi.fn(() => {
      state.isMaximised = true;
    }),
    unmaximize: vi.fn(() => {
      state.isMaximised = false;
    }),
    close: vi.fn(),
    on: (event: string, listener: () => void) => {
      changes.set(event, listener);
    },
    webContents: {
      send: vi.fn(),
      ipc: {
        on: (channel: string, listener: (event: Asking) => void) => {
          asked.set(channel, listener);
        },
      },
    },
  };

  answerAboutTheFrame(window);

  const ask = (channel: string): WindowFrame => {
    const event: Asking = { returnValue: { isMaximised: false, isFullScreen: false } };

    asked.get(channel)?.(event);

    return event.returnValue;
  };

  return { window, state, ask, changes };
};

describe('answerAboutTheFrame', () => {
  it('says at once whether the window is maximised or full screen', () => {
    const { ask } = aWindow(true);

    expect(ask(WHAT_THE_FRAME_IS)).toEqual({ isMaximised: true, isFullScreen: false });
  });

  it('minimises and closes the window when the page asks', () => {
    const { window, ask } = aWindow();

    ask(MINIMISE_THE_WINDOW);
    ask(CLOSE_THE_WINDOW);

    expect([window.minimize.mock.calls.length, window.close.mock.calls.length]).toEqual([1, 1]);
  });

  it('maximises a window that is not, and restores one that is', () => {
    const { window, ask } = aWindow();

    ask(MAXIMISE_THE_WINDOW);
    ask(MAXIMISE_THE_WINDOW);

    expect([window.maximize.mock.calls.length, window.unmaximize.mock.calls.length]).toEqual([
      1, 1,
    ]);
  });

  it('tells the page each time the window is maximised, restored, or goes in or out of full screen', () => {
    const { window, state, changes } = aWindow();

    state.isMaximised = true;
    changes.get('maximize')?.();
    state.isFullScreen = true;
    changes.get('enter-full-screen')?.();
    state.isFullScreen = false;
    changes.get('leave-full-screen')?.();
    state.isMaximised = false;
    changes.get('unmaximize')?.();

    expect(window.webContents.send.mock.calls).toEqual([
      [FRAME_CHANGED, { isMaximised: true, isFullScreen: false }],
      [FRAME_CHANGED, { isMaximised: true, isFullScreen: true }],
      [FRAME_CHANGED, { isMaximised: true, isFullScreen: false }],
      [FRAME_CHANGED, { isMaximised: false, isFullScreen: false }],
    ]);
  });
});
