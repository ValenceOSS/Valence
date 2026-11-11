import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

const HIGH_DEFINITION: ReadonlySet<string> = new Set(['1440p', '1080p', '720p']);

/**
 * How sharp a picture is sold as: 4K, HD or SD by the sharpest quality step it reaches, so a
 * widescreen film is judged by its width.
 *
 * @param item - Its picture's size.
 * @returns Its sharpness, or null where its size is unknown.
 */
const sharpnessOf = (item: Pick<MediaItem, 'width' | 'height'>): '4K' | 'HD' | 'SD' | null => {
  const step = sharpestStepOf(item);

  return step === null
    ? null
    : step.id === '2160p'
      ? '4K'
      : HIGH_DEFINITION.has(step.id)
        ? 'HD'
        : 'SD';
};

export { sharpnessOf };
