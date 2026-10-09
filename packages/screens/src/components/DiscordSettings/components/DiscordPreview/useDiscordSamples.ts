import { isEpisodicKind } from '@ValenceContracts/functions/isEpisodicKind';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const ASKED_FOR = 60;

type DiscordSamples = {
  film: MediaSummary | null;
  episode: MediaSummary | null;
  track: MusicTrack | null;
  pickAgain: () => void;
};

/**
 * Picks one of a list by a number between nought and one, so the same number keeps the same choice.
 *
 * @param list - What to pick from.
 * @param at - Where in it to pick, between nought and one.
 * @returns The one picked, or nothing where the list is empty.
 */
const pickFrom = <T>(list: readonly T[], at: number): T | null =>
  list[Math.min(Math.floor(at * list.length), list.length - 1)] ?? null;

/**
 * A film, an episode and a track from this server's own libraries, for the Discord preview to show
 * as if they were playing.
 *
 * The choice is held until asked to pick again, so the preview keeps showing the same titles while
 * settings are changed around them. Where a library of that kind is empty or missing, that sample
 * is nothing and the preview makes do with a made-up one.
 *
 * @returns The samples, and a way to pick different ones.
 */
const useDiscordSamples = (): DiscordSamples => {
  const [at, setAt] = useState(Math.random);
  const libraries = useQuery(libraryQueries.all());
  const filmLibraries = (libraries.data ?? []).filter((library) => library.kind === 'movies');
  const showLibraries = (libraries.data ?? []).filter((library) => isEpisodicKind(library.kind));
  const films = useQuery(
    libraryQueries.across(
      filmLibraries.map((library) => library.id),
      { kind: 'films', limit: ASKED_FOR },
    ),
  );
  const episodes = useQuery(
    libraryQueries.across(
      showLibraries.map((library) => library.id),
      { kind: 'shows', limit: ASKED_FOR },
    ),
  );
  const albums = useQuery(musicQueries.albums('recent'));
  const album = pickFrom(albums.data ?? [], at);
  const tracks = useQuery({ ...musicQueries.album(album?.id ?? ''), enabled: album !== null });

  return {
    film: pickFrom(films.data ?? [], at),
    episode: pickFrom(episodes.data ?? [], (at * 7) % 1),
    track: pickFrom(tracks.data?.tracks ?? [], (at * 13) % 1),
    pickAgain: () => {
      setAt(Math.random());
    },
  };
};

export type { DiscordSamples };

export { useDiscordSamples };
