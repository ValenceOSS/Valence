import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import type { MediaDetail, MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Everything Valence knows about a file, for the summary given, with an English stereo track and an
 * English subtitle.
 *
 * @param summary - The file's summary.
 * @returns The file.
 */
const aJellyfinDetail = (summary: MediaSummary): MediaDetail =>
  MediaDetailSchema.parse({
    id: summary.id,
    libraryId: summary.libraryId,
    title: summary.title,
    container: 'mkv',
    durationSeconds: summary.durationSeconds,
    videoCodec: 'h264',
    videoRange: 'SDR',
    width: 1920,
    height: 1080,
    bitrateKbps: 8000,
    addedAt: summary.addedAt,
    audioStreams: [
      { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
    ],
    subtitleStreams: [{ index: 2, format: 'srt', language: 'eng', isForced: false }],
    metadata: {
      overview: 'Hackers are blackmailed into stealing a black box.',
      hasPoster: true,
      hasBackdrop: true,
      hasLogo: false,
      cast: [{ personId: 3, name: 'Robert Redford', role: 'Martin Bishop', imageUrl: null }],
    },
  });

export { aJellyfinDetail };
