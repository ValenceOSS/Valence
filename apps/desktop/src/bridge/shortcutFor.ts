import type { Shortcut } from '@ValenceDesktop/bridge/Shortcut';

type KeysPressed = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'
>;

/**
 * The key pressed, as the letter on it where it is a letter, read from where it sits on the
 * keyboard when the layout writes something else there, so a shortcut works whatever the alphabet.
 *
 * @param keys - The keys pressed.
 * @returns The key, a letter in lower case.
 */
const theKey = ({ key, code }: KeysPressed): string => {
  if (/^[a-z]$/iu.test(key)) {
    return key.toLowerCase();
  }

  return /^Key[A-Z]$/u.test(code) ? code.slice('Key'.length).toLowerCase() : key;
};

/**
 * The shortcut of the application menu's that the keys pressed stand for on Windows and Linux,
 * where the window has no menu bar to hear them: those Electron's menu answered there. A Mac's
 * menu bar hears its own, so nothing is answered on a Mac. Alt, AltGr and the Windows key keep
 * their combinations for themselves.
 *
 * @param keys - The keys pressed.
 * @param platform - Which system this is.
 * @returns The shortcut, or nothing.
 */
const shortcutFor = (keys: KeysPressed, platform: string): Shortcut | null => {
  if (platform === 'darwin' || keys.altKey || keys.metaKey) {
    return null;
  }

  if (!keys.ctrlKey) {
    return keys.key === 'F11' && !keys.shiftKey ? 'toggle-full-screen' : null;
  }

  const key = theKey(keys);

  switch (key) {
    case '+':
    case '=':
      return 'zoom-in';
    case '-':
    case '_':
      return 'zoom-out';
    case '0':
      return keys.shiftKey ? null : 'actual-size';
    case 'r':
      return keys.shiftKey ? 'force-reload' : 'reload';
    case 's':
      return keys.shiftKey ? 'change-server' : null;
    case 'i':
      return keys.shiftKey ? 'toggle-dev-tools' : null;
    case 'm':
      return keys.shiftKey ? null : 'minimise';
    case 'w':
      return keys.shiftKey ? null : 'close-window';
    case 'q':
      return keys.shiftKey || platform !== 'linux' ? null : 'quit';
    default:
      return null;
  }
};

export { shortcutFor };
