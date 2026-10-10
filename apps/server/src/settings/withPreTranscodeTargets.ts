import { z } from 'zod';
import { PreTranscodeTargetSchema } from '@ValenceContracts/schemas/PreTranscoding';

const SingleTargetSchema = PreTranscodeTargetSchema.extend({
  quality: PreTranscodeTargetSchema.shape.quality.unwrap(),
}).passthrough();

const HasTargetsSchema = z.object({ targets: z.array(z.object({}).passthrough()) });

/**
 * Carries pre-transcoding settings saved before it made a ladder over to one: the single copy they
 * described becomes the only rung, rather than being dropped for the default. Settings that already
 * hold rungs, or hold nothing recognisable, pass through for the schema to judge.
 *
 * @param stored - The pre-transcoding settings as they were read back.
 * @returns The same settings, holding their copy as a rung where they described one on its own.
 */
const withPreTranscodeTargets = <Stored>(stored: Stored) => {
  if (HasTargetsSchema.safeParse(stored).success) {
    return stored;
  }

  const single = SingleTargetSchema.safeParse(stored);

  if (!single.success) {
    return stored;
  }

  const { quality, videoCodec, container, maxBitrateKbps, audio, ...rest } = single.data;

  return { ...rest, targets: [{ quality, videoCodec, container, maxBitrateKbps, audio }] };
};

export { withPreTranscodeTargets };
