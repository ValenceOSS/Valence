import { z } from 'zod';

const FRACTION = z.number().min(0).max(1);

const PictureAreaSchema = z
  .object({ x: FRACTION, y: FRACTION, width: FRACTION.gt(0), height: FRACTION.gt(0) })
  .refine((area) => area.x + area.width <= 1 && area.y + area.height <= 1);

type PictureArea = z.infer<typeof PictureAreaSchema>;

/**
 * Asks where the picture sits inside a session's frame, as fractions of it, so a film kept with
 * black bars in its frame can be fitted by its picture rather than by its bars.
 *
 * The server works it out beside the session rather than before it, so this answers with nothing
 * until it has, and the whole frame is drawn meanwhile.
 *
 * @param sessionId - The session playing.
 * @returns Where the picture is, or nothing yet.
 */
const readPictureArea = async (sessionId: string): Promise<PictureArea | null> => {
  const response = await fetch(`/api/playback/session/${sessionId}/picture.json`).catch(() => null);

  if (response?.ok !== true) {
    return null;
  }

  const read = PictureAreaSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export type { PictureArea };

export { readPictureArea };
