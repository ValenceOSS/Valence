import type { DownloadQuality } from '@ValenceContracts/schemas/Download';
import { say } from '@ValenceI18n/say';

const MEANINGS = {
  original: say('core.describeQualityMeaning.exactlyWhatIsOnTheServer'),
  '2160p': say('core.describeQualityMeaning.everyPixelTheFilmHasOn'),
  '1440p': say('core.describeQualityMeaning.sharperThanMostStreamingServicesOnly'),
  '1080p': say('core.describeQualityMeaning.aboutWhatAStreamingServiceGives'),
  '720p': say('core.describeQualityMeaning.hardToTellApartFrom1080p'),
  '480p': say('core.describeQualityMeaning.noticeablySofterStillPerfectlyWatchableGood'),
  '360p': say('core.describeQualityMeaning.forWhenSpaceIsTightAnd'),
  '240p': say('core.describeQualityMeaning.forWhenSpaceIsVeryTight'),
  '144p': say('core.describeQualityMeaning.forWhenSpaceIsVeryTight'),
} as const satisfies Record<DownloadQuality, string>;

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
const describeQualityMeaning = (quality: DownloadQuality): string => MEANINGS[quality];

export { describeQualityMeaning };
