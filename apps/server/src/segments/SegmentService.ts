import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type SegmentService = {
  list: (mediaId: string) => Promise<MediaSegment[]>;
  replace: (mediaId: string, segments: MediaSegment[]) => Promise<void>;
  chapters: (mediaId: string) => Promise<VideoChapter[]>;
};

export type { SegmentService };
