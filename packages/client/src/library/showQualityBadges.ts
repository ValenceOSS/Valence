import { describeChannels } from '@ValenceCore/functions/describeTrack';
import { describeRange } from '@ValenceClient/library/describeRange';
import { sharpnessOf } from '@ValenceClient/library/sharpnessOf';
import { soundOf } from '@ValenceClient/library/soundOf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowQualityBadge } from './showQualityBadges.types';
import { say } from '@ValenceI18n/say';

const SHARPEST_FIRST: readonly string[] = ['4K', 'HD', 'SD'];

const RICHEST_RANGE_FIRST: readonly string[] = ['DolbyVision', 'HDR10Plus', 'HDR10', 'HLG'];

const MOST_CHANNELS_FIRST: readonly number[] = [12, 10, 8, 7, 6, 4, 3, 2, 1];

/**
 * One badge for one thing every episode is sold on: the same for all of them where they agree, or
 * where they do not, every kind among them from the best or the most common down, marked as mixed.
 *
 * @param found - What each episode has, or null where it has nothing worth saying.
 * @param ordinary - What an episode with nothing worth saying has, said only beside the others.
 * @param order - The kinds from best to worst, where there is a best.
 * @returns The badge, or null where no episode has anything worth saying.
 */
const badgeAcross = (
  found: readonly (string | null)[],
  ordinary: string | null,
  order: readonly string[] = [],
): ShowQualityBadge | null => {
  if (found.every((kind) => kind === null)) {
    return null;
  }

  const named = found.map((kind) => kind ?? ordinary);
  const counts = new Map<string, number>();

  for (const kind of named) {
    if (kind !== null) {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  }

  const kinds = [...counts.keys()].sort((left, right) =>
    order.length > 0
      ? order.indexOf(left) - order.indexOf(right)
      : (counts.get(right) ?? 0) - (counts.get(left) ?? 0),
  );
  const isMixed = kinds.length > 1 || named.some((kind) => kind === null);

  return { label: kinds.join(' / '), isMixed };
};

/**
 * The badges a programme earns for how its episodes look and sound, as a film earns them for its
 * one file: its sharpness, its dynamic range, its sound format and its channels. A programme whose
 * episodes differ, some in 4K and some in HD, says so, every kind on the one badge, marked as mixed
 * so it can be drawn apart from one every episode shares.
 *
 * @param episodes - Every episode there is a file for.
 * @returns The badges, in the order they read.
 */
const showQualityBadges = (
  episodes: readonly Pick<MediaSummary, 'width' | 'height' | 'videoRange' | 'audio'>[],
): ShowQualityBadge[] => {
  const sounds = episodes.map((episode) => soundOf(episode.audio));

  return [
    badgeAcross(
      episodes.map((episode) => sharpnessOf(episode)),
      null,
      SHARPEST_FIRST,
    ),
    badgeAcross(
      episodes.map((episode) => describeRange(episode.videoRange)),
      say('client.library.showQualityBadges.standardRange'),
      [
        ...RICHEST_RANGE_FIRST.map((range) => describeRange(range) ?? range),
        say('client.library.showQualityBadges.standardRange'),
      ],
    ),
    badgeAcross(
      sounds.map((sound) => sound.format),
      null,
    ),
    sounds.every((sound) => sound.channels === null)
      ? null
      : badgeAcross(
          episodes.map(
            ({ audio }, at) =>
              sounds[at]?.channels ??
              (audio !== null && audio !== undefined && !audio.isAtmos && audio.channels === 2
                ? describeChannels(2)
                : null),
          ),
          null,
          MOST_CHANNELS_FIRST.map((count) => describeChannels(count)),
        ),
  ].filter((badge) => badge !== null);
};

export { showQualityBadges };
