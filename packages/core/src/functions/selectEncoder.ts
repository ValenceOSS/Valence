import { chainRunsHere } from '@ValenceCore/functions/chainRunsHere';
import type { VerifiedChain } from '@ValenceCore/functions/chainRunsHere';

type VerifiedEncoder = {
  codec: string;
  encoder: string;
  accel: string;
};

type ToneMapping = 'zscale' | 'libplacebo' | 'unavailable';

type Capabilities = {
  encoders: VerifiedEncoder[];
  rejected?: VerifiedEncoder[];
  chains?: VerifiedChain[];
  toneMapping?: ToneMapping;
  canBurnTextSubtitles?: boolean;
  canBurnImageSubtitles?: boolean;
};

/**
 * Picks which encoder to use for a codec, preferring hardware over software since a transcode is
 * the expensive thing a server does. An operator can force a particular acceleration, in which case
 * that one is used even if it was rejected at startup — forcing is how somebody investigates why it
 * was.
 *
 * A card that opens an encoder is not a card that runs the chain around it. The media service
 * proves both at startup — one frame for the encoder, four through the whole graph at each depth —
 * and until now only the first answer was read. A machine whose ten bit transcode chain had been
 * measured and found broken was handed ten bit films anyway, and failed them one at a time. So a
 * piece of hardware now has to have proved the shape as well as the encoder before it is preferred.
 *
 * Only the preference is withdrawn. Where nothing else can encode the codec at all the hardware is
 * still used, a chain that failed a probe being a better bet than no picture.
 *
 * @param capabilities - The encoders this server verified at startup, those it rejected, and the chains it ran.
 * @param codec - The codec being encoded to.
 * @param forced - An acceleration an operator insisted on, or empty to choose freely.
 * @param bitDepth - How deep the source is, the chains having been measured at eight bits and ten.
 * @returns The encoder to run, or null where this server can encode that codec no way at all.
 */
const selectEncoder = (
  capabilities: Capabilities,
  codec: string,
  forced = '',
  bitDepth?: number,
): VerifiedEncoder | null => {
  const wanted = forced.trim().toLowerCase();

  if (wanted !== '' && wanted !== 'none') {
    const matches = (encoder: VerifiedEncoder) =>
      encoder.codec === codec && encoder.accel === wanted;

    return (
      capabilities.encoders.find(matches) ??
      (capabilities.rejected ?? []).find(matches) ??
      capabilities.encoders.find(
        (encoder) => encoder.codec === codec && encoder.accel === 'none',
      ) ??
      null
    );
  }

  const proved = (encoder: VerifiedEncoder) =>
    chainRunsHere(capabilities.chains ?? [], encoder.accel, 'transcode', bitDepth);

  return (
    capabilities.encoders.find(
      (encoder) => encoder.codec === codec && encoder.accel !== 'none' && proved(encoder),
    ) ??
    capabilities.encoders.find((encoder) => encoder.codec === codec && encoder.accel === 'none') ??
    capabilities.encoders.find((encoder) => encoder.codec === codec) ??
    null
  );
};

export type { Capabilities, ToneMapping, VerifiedEncoder };

export { selectEncoder };
