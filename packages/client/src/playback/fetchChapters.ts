import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { VideoChapterListSchema } from '@ValenceContracts/schemas/VideoChapter';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

const ChapterAnswerSchema = z.object({ chapters: VideoChapterListSchema });

/**
 * Reads the chapters an item's file marks, in order, for naming them along the timeline.
 *
 * @param mediaId - The item being played.
 * @returns Its chapters, or none where the file marks none.
 */
const fetchChapters = async (mediaId: string): Promise<VideoChapter[]> =>
  (await readFromServer(`/api/media/${mediaId}/chapters`, ChapterAnswerSchema)).chapters;

export { fetchChapters };
