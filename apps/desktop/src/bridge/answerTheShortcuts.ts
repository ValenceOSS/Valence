import { shortcutFor } from '@ValenceDesktop/bridge/shortcutFor';
import type { Shortcut } from '@ValenceDesktop/bridge/Shortcut';
import { tellTheHost } from '@ValenceDesktop/bridge/tellTheHost';

const REPEATED: ReadonlySet<Shortcut> = new Set<Shortcut>(['zoom-in', 'zoom-out']);

/**
 * Answers the application menu's shortcuts where the window has no menu bar to hear them, which
 * is on Windows and Linux, by asking the host for the menu's item. A key the page already used,
 * such as one the player or a text field took, is left to it, as a menu bar leaves it, and only
 * zooming answers a key held down.
 *
 * @param target - The window the page is in.
 * @param platform - Which system this is.
 * @returns How to stop answering.
 */
const answerTheShortcuts = (target: Window, platform: string): (() => void) => {
  const answer = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.isComposing) {
      return;
    }

    const shortcut = shortcutFor(event, platform);

    if (shortcut === null || (event.repeat && !REPEATED.has(shortcut))) {
      return;
    }

    event.preventDefault();
    tellTheHost('press_a_shortcut', { shortcut });
  };

  target.addEventListener('keydown', answer);

  return () => {
    target.removeEventListener('keydown', answer);
  };
};

export { answerTheShortcuts };
