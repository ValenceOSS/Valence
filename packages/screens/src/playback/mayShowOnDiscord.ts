import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';

type ShownOnDiscord = {
  kind: 'film' | 'episode' | 'track';
  libraryId?: string;
  isPlaying: boolean;
};

/**
 * Whether something playing may appear on Discord, by the profile's own settings: films, TV and
 * music each have a switch, a library can be kept private, and a pause can be left off.
 *
 * Whether the profile shows anything at all, and whether this is the desktop app, are asked
 * separately, because the settings page asks this to draw its preview while nothing is playing.
 *
 * @param playing - What is playing, which library it is in where that is known, and whether it is
 *   playing or paused.
 * @param settings - The profile's Discord settings.
 * @returns Whether it may be shown.
 */
const mayShowOnDiscord = (
  { kind, libraryId, isPlaying }: ShownOnDiscord,
  settings: DiscordPresence,
): boolean => {
  const isShared =
    kind === 'film'
      ? settings.sharesFilms
      : kind === 'episode'
        ? settings.sharesShows
        : settings.sharesMusic;
  const isKeptPrivate = libraryId !== undefined && settings.hiddenLibraryIds.includes(libraryId);

  return isShared && !isKeptPrivate && (isPlaying || settings.showsWhilePaused);
};

export type { ShownOnDiscord };

export { mayShowOnDiscord };
