import type { Presence } from '@ValenceDesktop/main/tellDiscord';

type ClosingWindow = {
  on: (event: 'closed', listener: () => void) => void;
};

/**
 * Takes somebody's Discord status down when the window showing Valence is closed.
 *
 * Closing the window is not quitting everywhere: on macOS the red button closes the window and
 * leaves Valence running, and the page that kept the status up to date goes with the window. With
 * nobody left to say it had stopped, Discord would go on showing the last film for as long as the
 * application stayed open. Minimising closes nothing, so a minimised window keeps its status.
 *
 * @param window - The window showing Valence.
 * @param discord - Where the status is published.
 */
const takeTheStatusDownWithTheWindow = (
  window: ClosingWindow,
  discord: Pick<Presence, 'about'>,
): void => {
  window.on('closed', () => {
    discord.about(null);
  });
};

export { takeTheStatusDownWithTheWindow };
