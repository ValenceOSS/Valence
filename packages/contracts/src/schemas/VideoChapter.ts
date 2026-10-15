import { z } from 'zod';

const VideoChapterSchema = z.object({
  title: z.string().nullable(),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative(),
});

const VideoChapterListSchema = z.array(VideoChapterSchema);

type VideoChapter = z.infer<typeof VideoChapterSchema>;

export type { VideoChapter };

export { VideoChapterSchema, VideoChapterListSchema };
