import { aDiscordActivity } from '@ValenceClient/discord/aDiscordActivity';
import { mayShowOnDiscord } from '@ValenceScreens/playback/mayShowOnDiscord';
import { discordLookOf } from '@ValenceScreens/playback/discordLookOf';
import { theWatchingStatus } from '@ValenceScreens/playback/theWatchingStatus';
import { theListeningStatus } from '@ValenceScreens/playback/theListeningStatus';
import { theTracksArtworkUrl } from '@ValenceScreens/music/theTracksArtworkUrl';
import type { DiscordActivity } from '@ValenceClient/discord/aDiscordActivity';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { DiscordSamples } from './useDiscordSamples';
import { say } from '@ValenceI18n/say';

type PreviewState = 'film' | 'episode' | 'music' | 'paused' | 'party' | 'browsing';

const A_MINUTE = 60_000;

const PARTY = { id: 'preview', size: 3 };

const MADE_UP_FILM = { title: say('common.film'), durationSeconds: 6600 };

const MADE_UP_EPISODE = {
  title: say('common.episode'),
  seriesTitle: say('common.shows'),
  seasonNumber: 1,
  episodeNumber: 3,
  durationSeconds: 2700,
};

/**
 * Where in a sample the preview pretends to be, a third of the way through.
 *
 * @param durationSeconds - How long it runs, where that is known.
 * @returns The position in seconds.
 */
const aThirdThrough = (durationSeconds: number | undefined): number =>
  typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds / 3 : 600;

/**
 * Exactly what Discord would be shown in one state, with these samples and these settings: the same
 * rules decide what may be shown, the same status is built, and the same activity is made from it as
 * when something really plays, so the preview cannot say one thing and the window send another.
 *
 * @param state - Which state to show.
 * @param samples - A film, an episode and a track from the libraries, or nothing for each where there
 *   are none, in which case a made-up one stands in.
 * @param settings - The profile's Discord settings as they would be saved.
 * @param now - The time now in milliseconds.
 * @returns The activity Discord would be sent, or nothing where the status would be cleared.
 */
const theDiscordPreview = (
  state: PreviewState,
  { film, episode, track }: Pick<DiscordSamples, 'film' | 'episode' | 'track'>,
  settings: DiscordPresence,
  now: number,
): DiscordActivity | null => {
  const idle = settings.showsBrowsing
    ? aDiscordActivity({ kind: 'browsing', look: discordLookOf(settings) }, now - 20 * A_MINUTE)
    : null;

  if (state === 'browsing') {
    return idle;
  }

  if (state === 'music') {
    if (!mayShowOnDiscord({ kind: 'track', isPlaying: true }, settings)) {
      return idle;
    }

    return aDiscordActivity(
      theListeningStatus({
        title: track?.title ?? say('common.music'),
        artists: track === null ? [] : track.artists.map((artist) => artist.name),
        durationSeconds: track?.durationSeconds ?? 210,
        positionSeconds: aThirdThrough(track?.durationSeconds),
        isPlaying: true,
        artwork:
          track === null ? null : theTracksArtworkUrl(track.album.id, track.album.hasArtwork),
        party: null,
        settings,
        now,
      }),
      now,
    );
  }

  const media: Partial<MediaSummary> & { title: string } =
    state === 'film' ? (film ?? MADE_UP_FILM) : (episode ?? MADE_UP_EPISODE);
  const isPlaying = state !== 'paused';
  const kind = state === 'film' ? 'film' : 'episode';

  if (
    !mayShowOnDiscord(
      {
        kind,
        isPlaying,
        ...(media.libraryId === undefined ? {} : { libraryId: media.libraryId }),
      },
      settings,
    )
  ) {
    return idle;
  }

  return aDiscordActivity(
    theWatchingStatus({
      media: {
        title: media.title,
        ...(media.seriesTitle === undefined ? {} : { seriesTitle: media.seriesTitle }),
        ...(media.seasonNumber === undefined ? {} : { seasonNumber: media.seasonNumber }),
        ...(media.episodeNumber === undefined ? {} : { episodeNumber: media.episodeNumber }),
        ...(media.externalId === undefined ? {} : { externalId: media.externalId }),
        ...(media.posterUrl === undefined ? {} : { posterUrl: media.posterUrl }),
        ...(media.durationSeconds === undefined ? {} : { durationSeconds: media.durationSeconds }),
      },
      positionSeconds: aThirdThrough(media.durationSeconds),
      isPlaying,
      party: state === 'party' ? PARTY : null,
      settings,
      now,
    }),
    now,
  );
};

export type { PreviewState };

export { theDiscordPreview };
