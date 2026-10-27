import { RESOLUTIONS } from '@ValenceContracts/schemas/ParsedRelease';
import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';
import { isLowerQuality } from './isLowerQuality';

type Screen = {
  maxHeight: number;
  showsHdr: boolean;
  playsCodec: (codec: NonNullable<StreamOffer['codec']>) => boolean;
  runtimeMinutes: number | null;
};

const HEIGHTS: Readonly<Record<NonNullable<StreamOffer['resolution']>, number>> = {
  '2160p': 2160,
  '1080p': 1080,
  '720p': 720,
  '576p': 576,
  '480p': 480,
};

const SOURCES: readonly StreamOffer['source'][] = [
  'remux',
  'bluray',
  'webdl',
  'webrip',
  'hdtv',
  'dvd',
  null,
];

const GOOD_BYTES_PER_HOUR: Readonly<Record<'2160p' | '1080p', [number, number]>> = {
  '2160p': [8e9, 25e9],
  '1080p': [3e9, 6e9],
};

/**
 * How far an offer's size is from what a release of its resolution usually takes, as a fraction:
 * nothing inside the usual span, more the further outside it.
 *
 * @param offer - The offer.
 * @param runtimeMinutes - How long the film runs, where known.
 * @returns How far off it is.
 */
const offSizeOf = (offer: StreamOffer, runtimeMinutes: number | null): number => {
  const span =
    offer.resolution === '2160p' || offer.resolution === '1080p'
      ? GOOD_BYTES_PER_HOUR[offer.resolution]
      : null;

  if (span === null || offer.sizeBytes === null || runtimeMinutes === null || runtimeMinutes <= 0) {
    return 0;
  }

  const perHour = offer.sizeBytes / (runtimeMinutes / 60);
  const [least, most] = span;

  return perHour < least ? least / perHour - 1 : perHour > most ? perHour / most - 1 : 0;
};

/**
 * Chooses the stream to play when somebody presses Play rather than choosing one: only one ready to
 * start straight away and filmed from a release rather than in a cinema; then one this device plays
 * without converting the picture — a codec it decodes, and no HDR on a screen that cannot show it;
 * then the sharpest picture the screen can show; then a remux or Blu-ray before a web release,
 * before a broadcast or a DVD; then a size usual for its resolution, which keeps both starved
 * encodes and enormous remuxes back; and last, the best seeded.
 *
 * @param offers - What the sources offer.
 * @param screen - What this device can show and decode, and how long the film runs.
 * @returns The stream to play, or null where none can start straight away.
 */
const pickStreamOffer = (offers: readonly StreamOffer[], screen: Screen): StreamOffer | null => {
  const rank = (offer: StreamOffer): number[] => {
    const height = offer.resolution === null ? 0 : HEIGHTS[offer.resolution];
    const plays =
      (offer.codec === null || screen.playsCodec(offer.codec)) &&
      (screen.showsHdr || offer.hdr.length === 0);

    return [
      plays ? 0 : 1,
      height > screen.maxHeight ? 1 : 0,
      offer.resolution === null ? RESOLUTIONS.length : RESOLUTIONS.indexOf(offer.resolution),
      SOURCES.indexOf(offer.source),
      Math.round(offSizeOf(offer, screen.runtimeMinutes) * 10),
      -(offer.seeders ?? 0),
    ];
  };

  const ranked = offers
    .filter((offer) => offer.isReady && !isLowerQuality(offer))
    .map((offer) => ({ offer, place: rank(offer) }))
    .toSorted((one, other) =>
      one.place.reduce((order, part, at) => order || part - (other.place[at] ?? 0), 0),
    );

  return ranked[0]?.offer ?? null;
};

export type { Screen };

export { pickStreamOffer };
