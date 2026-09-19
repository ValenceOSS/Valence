import { MediaFactsSchema } from './MediaFacts';
import type { MediaFacts } from './MediaFacts';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';

type FactsFromProbeOptions = {
  probe: MediaProbe;
  sizeBytes: number;
  modifiedAtMs: number;
};

/**
 * Everything the library records about a file, read out of a probe of it.
 *
 * One shape used twice, and deliberately: it is what gets written to the row when an encode takes a
 * film's place, and it is what was stored before that happened so the row can be put back exactly
 * as it was if somebody rejects the encode. Rejecting has to restore the row as well as the file,
 * or the library would go on describing a 6 GB encode while holding a 70 GB remux.
 *
 * @param options - The probe, and the size and modification time nothing but the filesystem knows.
 * @returns The facts, checked.
 */
const factsFromProbe = ({ probe, sizeBytes, modifiedAtMs }: FactsFromProbeOptions): MediaFacts =>
  MediaFactsSchema.parse({
    sizeBytes,
    modifiedAtMs,
    container: probe.container,
    durationSeconds: probe.durationSeconds,
    bitrateKbps: probe.bitrateKbps,
    videoCodec: probe.video?.codec ?? 'unknown',
    videoCodecTag: probe.video?.codecTag ?? null,
    videoRange: probe.video?.range ?? 'SDR',
    videoRangeBase: probe.video?.rangeBase ?? null,
    videoBitDepth: probe.video?.bitDepth ?? null,
    canCopySegments: probe.canCopySegments ?? null,
    videoLevel: probe.video?.level ?? null,
    videoFrameRate: probe.video?.frameRate ?? null,
    videoIsInterlaced: probe.video?.isInterlaced ?? null,
    videoRefFrames: probe.video?.refFrames ?? null,
    videoPixelAspect: probe.video?.pixelAspect ?? null,
    videoRotationDegrees: probe.video?.rotationDegrees ?? null,
    width: probe.video?.width ?? 0,
    height: probe.video?.height ?? 0,
    audioStreams: probe.audioStreams,
    subtitleStreams: probe.subtitleStreams,
    chapters: probe.chapters,
  });

export type { FactsFromProbeOptions };

export { factsFromProbe };
