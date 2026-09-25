import type { DownloadQuality } from '@ValenceContracts/schemas/Download';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const MEANINGS = {
  original: 'core.describeQualityMeaning.original',
  '2160p': 'core.describeQualityMeaning.p2160',
  '1440p': 'core.describeQualityMeaning.p1440',
  '1080p': 'core.describeQualityMeaning.p1080',
  '720p': 'core.describeQualityMeaning.p720',
  '480p': 'core.describeQualityMeaning.p480',
  '360p': 'core.describeQualityMeaning.p360',
  '240p': 'core.describeQualityMeaning.p240',
  '144p': 'core.describeQualityMeaning.p144',
} as const satisfies Record<DownloadQuality, StringKey>;

/**
 * What a rung means to look at, in words rather than in megabits.
 *
 * "1080p · 4.5 Mbps" tells somebody who thinks in bitrates everything and everybody else nothing,
 * and the people who most need help choosing are in the second group. The descriptions are anchored
 * to screens and situations rather than to adjectives, because "good quality" is not a fact anybody
 * can decide against — where "hard to tell apart from 1080p on a phone" is.
 *
 * @param quality - The rung, or the original.
 * @returns One sentence about what choosing it would look like.
 */
const describeQualityMeaning = (quality: DownloadQuality): string => say(MEANINGS[quality]);

export { describeQualityMeaning };
