import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { describeRange } from '@ValenceClient/library/describeRange';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Says what a file's picture is in the terms an administrator weighs a copy by: its resolution
 * step, and its dynamic range where it has more than the ordinary one.
 *
 * @param item - The file.
 * @returns Such as "4K · Dolby Vision" or "1080p", or null where the picture is too small to say.
 */
const describePicture = (
  item: Pick<MediaSummary, 'width' | 'height' | 'videoRange'>,
): string | null => {
  const said = [sharpestStepOf(item)?.label ?? null, describeRange(item.videoRange)].filter(
    (part) => part !== null,
  );

  return said.length === 0 ? null : said.join(' · ');
};

export { describePicture };
