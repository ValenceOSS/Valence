import { requireOptionalNativeModule } from 'expo';
import { TvDecodersSchema } from '@ValenceTv/playback/TvDecodersSchema';
import type { TvDecoders } from '@ValenceTv/playback/TvDecodersSchema';

type ValenceDecoders = { whatThisPlays: () => object };

/**
 * What this television's own decoders, screen and HDMI output say it can play, as Android reports
 * them. A television without the module — an Apple TV, or a test — says nothing, and neither does
 * one whose answer cannot be read.
 *
 * @param decoders - The module that asks Android, which is this television's own unless a test
 *   says otherwise.
 * @returns What it plays, or nothing where it cannot say.
 */
const whatThisTvPlays = (
  decoders: ValenceDecoders | null = requireOptionalNativeModule<ValenceDecoders>(
    'ValenceDecoders',
  ),
): TvDecoders | null => {
  if (decoders === null) {
    return null;
  }

  const read = TvDecodersSchema.safeParse(decoders.whatThisPlays());

  return read.success ? read.data : null;
};

export { whatThisTvPlays };
