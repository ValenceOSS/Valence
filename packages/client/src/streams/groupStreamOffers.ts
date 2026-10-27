import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';
import { say } from '@ValenceI18n/say';
import { isLowerQuality } from './isLowerQuality';

const GROUPS = ['2160p', '1080p', '720p', 'other', 'lower'] as const;

type StreamGroupId = (typeof GROUPS)[number];

type StreamGroup = { id: StreamGroupId; heading: string; offers: StreamOffer[] };

type GroupedOffers = {
  groups: StreamGroup[];
  isAnyReady: boolean;
  laterCount: number;
};

/**
 * Which heading an offer sits under: its resolution, anything else together, and copies filmed in
 * a cinema apart at the end.
 *
 * @param offer - The offer.
 * @returns Its group.
 */
const groupOf = (offer: StreamOffer): StreamGroupId =>
  isLowerQuality(offer)
    ? 'lower'
    : offer.resolution === '2160p' || offer.resolution === '1080p' || offer.resolution === '720p'
      ? offer.resolution
      : 'other';

/**
 * The heading a group sits under.
 *
 * @param group - The group.
 * @returns Its heading.
 */
const headingOf = (group: StreamGroupId): string =>
  group === 'lower'
    ? say('client.streams.groupStreamOffers.lowerQuality')
    : group === 'other'
      ? say('client.streams.groupStreamOffers.otherQualities')
      : (QUALITY_STEPS.find((step) => step.id === group)?.label ?? group);

/**
 * The streams a film is offered, arranged for choosing between: under the resolution each is, the
 * rest together and copies filmed in a cinema apart at the end, each group in the order offered.
 * Streams that have to download at their service first are left out while any can start straight
 * away, unless they are asked for, and counted so they can be.
 *
 * @param offers - What the sources offer, best first.
 * @param isShowingLater - Whether streams that download first are listed too.
 * @returns The groups that hold any, and how many streams download first.
 */
const groupStreamOffers = (
  offers: readonly StreamOffer[],
  isShowingLater: boolean,
): GroupedOffers => {
  const isAnyReady = offers.some((offer) => offer.isReady);
  const listed = isAnyReady && !isShowingLater ? offers.filter((offer) => offer.isReady) : offers;

  return {
    groups: GROUPS.flatMap((id) => {
      const inGroup = listed.filter((offer) => groupOf(offer) === id);

      return inGroup.length === 0 ? [] : [{ id, heading: headingOf(id), offers: inGroup }];
    }),
    isAnyReady,
    laterCount: isAnyReady ? offers.filter((offer) => !offer.isReady).length : 0,
  };
};

export type { GroupedOffers, StreamGroup, StreamGroupId };

export { groupStreamOffers };
