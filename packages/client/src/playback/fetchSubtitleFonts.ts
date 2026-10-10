import { z } from 'zod';

const SubtitleFontsSchema = z.object({ fonts: z.array(z.string()) });

/**
 * The addresses of the fonts a title carries for its own subtitles, or none where it carries none
 * or they cannot be read — a script then falls back to the fonts the player has.
 *
 * @param mediaId - The title.
 * @returns Where each font is served from.
 */
const fetchSubtitleFonts = async (mediaId: string): Promise<string[]> => {
  const answer = await fetch(`/api/media/${mediaId}/fonts`).catch(() => null);
  const read = SubtitleFontsSchema.safeParse(
    answer?.ok === true ? await answer.json().catch(() => null) : null,
  );

  return read.success
    ? read.data.fonts.map((name) => `/api/media/${mediaId}/fonts/${encodeURIComponent(name)}`)
    : [];
};

export { fetchSubtitleFonts };
