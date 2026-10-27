import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';
import { say } from '@ValenceI18n/say';
import { describeAudioCodec } from '@ValenceClient/library/describeAudioCodec';
import { describeRange } from '@ValenceClient/library/describeRange';

const RANGES: Readonly<Record<StreamOffer['hdr'][number], string>> = {
  dolbyVision: 'DolbyVision',
  hdr10plus: 'HDR10Plus',
  hdr10: 'HDR10',
  hlg: 'HLG',
};

const SOUNDS: Readonly<Partial<Record<StreamOffer['audio'][number], string>>> = {
  atmos: 'atmos',
  truehd: 'truehd',
  eac3: 'eac3',
  ac3: 'ac3',
};

/**
 * What a stream on offer is, in the words a source picker shows: the facts that tell streams apart —
 * its picture, its range, its sound, its size and whether it starts straight away — and beneath
 * them, where it comes from and what the file is called.
 *
 * @param offer - The offer.
 * @returns A line of facts, and a line saying where it is from.
 */
const describeStreamOffer = (offer: StreamOffer): { summary: string; detail: string } => {
  const step = QUALITY_STEPS.find((one) => one.id === offer.resolution);
  const range = offer.hdr[0];
  const sound = offer.audio.find((one) => SOUNDS[one] !== undefined);

  return {
    summary: [
      step?.label ?? offer.resolution,
      range === undefined ? null : describeRange(RANGES[range]),
      sound === undefined ? null : describeAudioCodec(SOUNDS[sound] ?? sound),
      offer.sizeBytes === null ? null : formatBytes(offer.sizeBytes),
      offer.isReady
        ? say('client.streams.describeStreamOffer.instant')
        : say('client.streams.describeStreamOffer.downloadsFirst'),
    ]
      .filter((part) => part !== null)
      .join(' · '),
    detail: say('client.streams.describeStreamOffer.sourceAndFile', {
      source: offer.sourceName,
      file: offer.fileName ?? offer.name,
    }),
  };
};

export { describeStreamOffer };
