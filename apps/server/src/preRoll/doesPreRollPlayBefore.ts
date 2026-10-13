import type { PreRollSettings } from '@ValenceContracts/schemas/PreRollSettings';

/**
 * Whether a clip plays before a title, given what the server is set to play pre-roll before.
 *
 * @param settings - The pre-roll settings.
 * @param isEpisode - Whether the title is an episode rather than a film.
 * @returns Whether one plays.
 */
const doesPreRollPlayBefore = (settings: PreRollSettings, isEpisode: boolean): boolean =>
  settings.isOn &&
  (settings.playsBefore === 'both' || settings.playsBefore === (isEpisode ? 'episodes' : 'films'));

export { doesPreRollPlayBefore };
