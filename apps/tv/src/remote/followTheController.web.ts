import { keysFromTheController } from '@ValenceTv/remote/keysFromTheController';
import { theController } from '@ValenceTv/remote/theController';
import type { followTheController as onTheTelevision } from '@ValenceTv/remote/followTheController';

const READS_EVERY_MS = 20;

type AskedOfTheBrowser = { gamepadInputEmulation?: string; userAgent: string };

/**
 * Has a controller drive the TV layout in a browser as a remote does, as Jellyfin's web client does
 * on an Xbox: its buttons are read fifty times a second while one is connected and the page has
 * the focus, and pressed as the keys a television's remote sends, on whatever has the remote, so
 * moving about, choosing, going back and the player all hear it as they hear a remote. A key pressed
 * this way does nothing of its own, where a real Enter on a button clicks it, so A clicks a button
 * or link itself, once a press, unless something has already taken the key. Microsoft's older Edge
 * is asked to hand the controller to the page rather than steer a pointer with it.
 *
 * @param page - The page, the document's own unless a test says otherwise.
 */
const followTheController: typeof onTheTelevision = (page: Document = document): void => {
  const view = page.defaultView;

  if (view === null || typeof view.navigator.getGamepads !== 'function') {
    return;
  }

  const asked: AskedOfTheBrowser = view.navigator;

  if (typeof asked.gamepadInputEmulation === 'string') {
    asked.gamepadInputEmulation = 'gamepad';
  }

  let holding: ReturnType<typeof keysFromTheController>['holding'] = new Map();
  let reading: number | null = null;

  const press = (type: 'keydown' | 'keyup', key: string, isRepeat: boolean): void => {
    const target = page.activeElement ?? page.body;
    const isUnhandled = target.dispatchEvent(
      new KeyboardEvent(type, { key, repeat: isRepeat, bubbles: true, cancelable: true }),
    );
    const isNativelyPressed =
      target instanceof view.HTMLButtonElement || target instanceof view.HTMLAnchorElement;

    if (type === 'keydown' && key === 'Enter' && !isRepeat && isUnhandled && isNativelyPressed) {
      target.click();
    }
  };

  const controllers = () =>
    [...view.navigator.getGamepads()].flatMap((pad) =>
      pad === null
        ? []
        : [{ buttons: pad.buttons.map((button) => button.pressed), axes: pad.axes }],
    );

  const read = (): void => {
    const keys = keysFromTheController(controllers(), holding, view.performance.now());

    holding = keys.holding;

    for (const key of keys.up) {
      press('keyup', key, false);
    }

    for (const { key, isRepeat } of keys.down) {
      theController().hear();
      press('keydown', key, isRepeat);
    }
  };

  const stop = (): void => {
    if (reading !== null) {
      view.clearInterval(reading);
      reading = null;
    }

    for (const key of holding.keys()) {
      press('keyup', key, false);
    }

    holding = new Map();
  };

  const start = (): void => {
    if (reading === null && page.hasFocus() && controllers().length > 0) {
      reading = view.setInterval(read, READS_EVERY_MS);
    }
  };

  view.addEventListener('gamepadconnected', start);
  view.addEventListener('gamepaddisconnected', () => {
    if (controllers().length === 0) {
      stop();
    }
  });
  view.addEventListener('focus', start);
  view.addEventListener('blur', stop);
  start();
};

export { followTheController };
