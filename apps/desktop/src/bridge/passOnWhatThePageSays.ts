import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { tellTheHost } from '@ValenceDesktop/bridge/tellTheHost';

/**
 * Passes on to the host what the shared screens say through the document: a change of server,
 * whether the window's own controls should show, the screen kept on, and what is playing.
 *
 * The controls are asked for again as a picture leaves full screen, which on macOS can bring the
 * window's own buttons back whatever the player last asked.
 *
 * @param within - The document the screens draw in.
 */
const passOnWhatThePageSays = (within: Document): void => {
  const showTheControlsAsAsked = (): void => {
    tellTheHost('show_the_window_controls', {
      isShown: within.documentElement.dataset['valenceWatching'] !== 'hidden',
    });
  };

  within.addEventListener('valence:change-server', () => {
    tellTheHost('change_server');
  });

  new MutationObserver(showTheControlsAsAsked).observe(within, {
    subtree: true,
    attributeFilter: ['data-valence-watching'],
  });

  within.addEventListener('fullscreenchange', () => {
    if (within.fullscreenElement === null) {
      showTheControlsAsAsked();
    }
  });

  within.addEventListener('valence:keep-the-screen-on', (event) => {
    tellTheHost('keep_the_screen_on', {
      isOn: event instanceof CustomEvent && event.detail === true,
    });
  });

  within.addEventListener('valence:now-watching', (event) => {
    tellTheHost('now_watching', {
      said: event instanceof CustomEvent ? JsonValueSchema.catch(null).parse(event.detail) : null,
    });
  });
};

export { passOnWhatThePageSays };
