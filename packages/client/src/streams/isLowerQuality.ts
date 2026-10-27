import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';

const LOWER: ReadonlySet<StreamOffer['source']> = new Set(['cam', 'telesync']);

/**
 * Whether an offer is a copy filmed in a cinema rather than a release of the film, which is never
 * chosen on somebody's behalf and is listed apart.
 *
 * @param offer - The offer.
 * @returns Whether it is.
 */
const isLowerQuality = (offer: Pick<StreamOffer, 'source'>): boolean => LOWER.has(offer.source);

export { isLowerQuality };
