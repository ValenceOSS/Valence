import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { chooseSource } from '@ValenceCore/functions/chooseSource';
import type { ChosenSource } from '@ValenceCore/functions/chooseSource';
import { sourcesOf } from '@ValenceCore/functions/sourcesOf';
import type { negotiatePlayback } from '@ValenceCore/functions/negotiatePlayback';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import { isImageSubtitle } from '@ValenceCore/functions/isImageSubtitle';
import { describePlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import { planToSessionSpec } from '@ValenceCore/functions/planToSessionSpec';
import { segmentContainerFor } from '@ValenceCore/functions/segmentContainerFor';
import { previewRequestFor } from '@ValenceServer/library/previewRequestFor';
import type { PreviewMoment } from '@ValenceContracts/schemas/Library';
import type { PreviewQuality } from '@ValenceContracts/schemas/PreviewQuality';
import {
  SEGMENT_SECONDS,
  SHORT_SEGMENT_SECONDS,
  TRICKPLAY_INTERVAL_SECONDS,
  TRICKPLAY_TILE_WIDTH,
  TRICKPLAY_COLUMNS,
  TRICKPLAY_ROWS,
} from './PlaybackService';
import { VideoRangeSchema } from '@ValenceContracts/schemas/MediaItem';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import type { PlaybackService } from './PlaybackService';
import type {
  Transcoder,
  TranscoderCapabilities,
  TranscoderStreamedFile,
} from '@ValenceServer/transcoder/TranscoderClient';
import { saying } from '@ValenceI18n/saying';

const TRICKPLAY_INDEX_NAME = 'thumbnails.vtt';

const PREVIEW_NAME = 'preview.mp4';

/**
 * Rewrites a plan to say what was actually done rather than what was decided, for the cases where
 * the media service does more than the negotiator asked — a session that was to pass the picture
 * through but is being encoded should report itself as encoding, or the statistics panel describes a
 * session nobody is watching.
 *
 * @param plan - What the negotiator decided.
 * @param item - The file it decided about.
 * @param encodesVideo - Whether the picture is in fact being encoded.
 * @returns The plan as carried out.
 */
/**
 * Corrects the range a plan claims to the one the output will really carry.
 *
 * A transcode that cannot tone map does not produce SDR. It re-encodes the picture and leaves its
 * colour metadata alone, so the stream stays HDR and a client that colour manages shows it
 * correctly. Announcing SDR while emitting PQ is the one answer that is wrong either way: it tells
 * a viewer their HDR was converted when it was not, and tells anything reading the plan to expect a
 * range the bytes contradict.
 *
 * @param plan - The plan as negotiated.
 * @param deliveredRange - The range the media service says the output will carry.
 * @returns The plan, saying what will really arrive.
 */
const withDeliveredRange = (plan: PlaybackPlan, deliveredRange: string): PlaybackPlan => {
  if (plan.video.kind !== 'transcode' || plan.video.range === deliveredRange) {
    return plan;
  }

  const range = VideoRangeSchema.safeParse(deliveredRange);

  return range.success ? { ...plan, video: { ...plan.video, range: range.data } } : plan;
};

const asDelivered = (plan: PlaybackPlan, item: MediaItem, encodesVideo: boolean): PlaybackPlan => {
  if (!encodesVideo || plan.video.kind !== 'passthrough') {
    return plan;
  }

  return {
    ...plan,
    video: {
      kind: 'transcode',
      codec: 'h264',
      range: item.videoRange,
      maxBitrateKbps: item.bitrateKbps,
      maxWidth: item.width,
      maxHeight: item.height,
      reason: {
        code: 'VideoNotSegmentable',
        detail: saying('server.playback.playbackService.theSourceCannotBeCutInto'),
      },
    },
  };
};

type MediaLookup = {
  findForPlayback: (mediaId: string) => Promise<{
    item: Parameters<typeof negotiatePlayback>[0];
    path: string;
    defaultAudioLanguage: string | null;
    generation: number;
    previewMoment?: PreviewMoment | null;
    renditions?: { id: string; item: Parameters<typeof negotiatePlayback>[0]; path: string }[];
  } | null>;
};

type CreatePlaybackServiceOptions = {
  media: MediaLookup;
  transcoder: Transcoder;
  sessionUrlPrefix: string;
  directUrlPrefix: string;
  trickplayUrlPrefix: string;
  forcedAccel?: () => Promise<string>;
  previewQuality?: () => Promise<PreviewQuality>;
  usesShortSegments?: () => Promise<boolean>;
  readFromDisk?: (path: string, range: string | null) => Promise<TranscoderStreamedFile | null>;
  readSessionFromDisk?: (
    paths: readonly string[],
    contentType: string,
  ) => Promise<TranscoderStreamedFile | null>;
};

/**
 * Playback as it actually runs: negotiating what a client can take, starting a session on the media
 * service where anything needs changing, and serving the file directly where nothing does — the
 * original, or a copy kept alongside it that the device plays as it is, which is what a copy made
 * ahead of time is for. A copy is only ever served by its identifier among the item's own, never by
 * a path a client names. Also where a session is stopped, kept alive and asked about.
 *
 * @param options - The library to read files from, the transcoder to run sessions on, and the
 *   settings that bound what a session may cost.
 * @returns The playback service.
 */
const createPlaybackService = ({
  media,
  transcoder,
  sessionUrlPrefix,
  directUrlPrefix,
  trickplayUrlPrefix,
  forcedAccel = () => Promise.resolve(''),
  previewQuality = (): Promise<PreviewQuality> => Promise.resolve('high'),
  usesShortSegments = () => Promise.resolve(false),
  readFromDisk,
  readSessionFromDisk,
}: CreatePlaybackServiceOptions): PlaybackService => {
  let cached: TranscoderCapabilities | null = null;

  const capabilities = async (): Promise<TranscoderCapabilities> => {
    if (cached !== null) {
      return cached;
    }

    const found = await transcoder.capabilities();

    cached = found;

    return found;
  };

  return {
    explain: async (mediaId, profile, requestedQuality) => {
      const found = await media.findForPlayback(mediaId);

      if (found === null) {
        return null;
      }

      const chosen = chooseSource({
        sources: sourcesOf(found),
        profile,
        requestedQuality: requestedQuality ?? 'original',
        preferredAudioLanguage: found.defaultAudioLanguage,
      });

      if (chosen === null) {
        return null;
      }

      return { mode: describePlaybackMode(chosen.plan), plan: chosen.plan };
    },

    start: async (
      mediaId,
      profile,
      startSeconds,
      audioStreamIndex,
      requestedQuality,
      deviceId,
      subtitleStreamIndex,
      isAdaptive,
    ) => {
      const found = await media.findForPlayback(mediaId);

      if (found === null) {
        return { kind: 'notFound' };
      }

      const sources = sourcesOf(found);
      const chosen = chooseSource({
        sources,
        profile,
        requestedQuality: requestedQuality ?? 'original',
        preferredAudioLanguage: found.defaultAudioLanguage,
        chosenSubtitleStreamIndex: subtitleStreamIndex ?? null,
      });

      if (chosen === null) {
        return { kind: 'notFound' };
      }

      const { plan } = chosen;
      const source = chosen.source.item;
      const rungs =
        isAdaptive === true
          ? sources
              .filter((candidate) => candidate.id !== chosen.source.id)
              .map((candidate) =>
                chooseSource({
                  sources: [candidate],
                  profile,
                  requestedQuality: 'original',
                  preferredAudioLanguage: found.defaultAudioLanguage,
                  chosenSubtitleStreamIndex: subtitleStreamIndex ?? null,
                }),
              )
              .filter(
                (weighed): weighed is ChosenSource =>
                  weighed !== null && weighed.plan.video.kind === 'passthrough',
              )
          : [];

      if (chosen.isDirectPlay && audioStreamIndex === undefined && rungs.length === 0) {
        const file = `${directUrlPrefix}/${mediaId}/file`;

        return {
          kind: 'started',
          session: {
            sessionId: `direct-${mediaId}`,
            delivery: {
              kind: 'direct',
              url: chosen.source.isOriginal
                ? file
                : `${file}?rendition=${encodeURIComponent(chosen.source.id)}`,
            },
            mode: describePlaybackMode(plan),
            plan,
            warnings: [],
            reuse: null,
          },
        };
      }

      const shortSegments = await usesShortSegments();
      const accel = await forcedAccel();
      const able = await capabilities();
      const specFor = (weighed: ChosenSource) => {
        const item = weighed.source.item;

        return planToSessionSpec({
          plan: weighed.plan,
          inputPath: weighed.source.path,
          sourceRange: item.videoRange,
          sourceRangeBase: item.videoRangeBase ?? null,
          sourceSize: [item.width, item.height],
          sourceVideoCodec: item.videoCodec,
          sourceBitDepth: item.videoBitDepth,
          sourceIsInterlaced: item.videoIsInterlaced,
          sourcePixelAspect: item.videoPixelAspect ?? null,
          imageSubtitleIndexes: item.subtitleStreams
            .filter((stream) => isImageSubtitle(stream.format))
            .map((stream) => stream.index),
          subtitleIndexes: item.subtitleStreams.map((stream) => stream.index),
          capabilities: able,
          forcedAccel: accel,
          startSeconds,
          segmentSeconds: shortSegments ? SHORT_SEGMENT_SECONDS : SEGMENT_SECONDS,
          container: segmentContainerFor(profile),
          ...(audioStreamIndex !== undefined
            ? { audioStreamIndex }
            : plan.audio.streamIndex === null
              ? {}
              : { audioStreamIndex: plan.audio.streamIndex }),
        });
      };

      const outcome = specFor(chosen);
      const variants = rungs.flatMap((rung) => {
        const made = specFor(rung);

        return made.kind === 'unsupported' ? [] : [made.spec];
      });

      if (outcome.kind === 'unsupported') {
        return { kind: 'unsupported', reason: outcome.reason };
      }

      try {
        const session = await transcoder.startSession(outcome.spec, deviceId, variants);

        const delivered = withDeliveredRange(
          asDelivered(plan, source, session.encodesVideo),
          outcome.deliveredRange,
        );

        return {
          kind: 'started',
          session: {
            sessionId: session.id,
            delivery: {
              kind: 'hls',
              manifestUrl: `${sessionUrlPrefix}/${session.id}/index.m3u8`,
            },
            mode: describePlaybackMode(delivered),
            plan: delivered,
            warnings: outcome.warnings,
            reuse: session.reuse,
          },
        };
      } catch (error) {
        return {
          kind: 'failed',
          reason:
            error instanceof Error
              ? sayVerbatim(describeFailure(error))
              : saying('server.playback.playbackService.theMediaServiceFailed'),
        };
      }
    },

    readSessionFile: async (sessionId, name) => {
      if (readSessionFromDisk === undefined || transcoder.locateSessionFile === undefined) {
        return transcoder.readSessionFile(sessionId, name);
      }

      const found = await transcoder.locateSessionFile(sessionId, name);

      if (found === null) {
        return null;
      }

      if (found.kind === 'bytes') {
        return found.file;
      }

      if (found.kind === 'unlocatable') {
        return transcoder.readSessionFile(sessionId, name);
      }

      return (
        (await readSessionFromDisk(found.files, found.contentType)) ??
        transcoder.readSessionFile(sessionId, name)
      );
    },

    readDirectFile: async (mediaId, range, renditionId = null) => {
      const found = await media.findForPlayback(mediaId);

      if (found === null) {
        return null;
      }

      const path =
        renditionId === null
          ? found.path
          : found.renditions?.find((one) => one.id === renditionId)?.path;

      if (path === undefined) {
        return null;
      }

      return (await readFromDisk?.(path, range)) ?? transcoder.readFile(path, range);
    },

    trickplay: async (mediaId) => {
      const found = await media.findForPlayback(mediaId);

      if (found === null) {
        return null;
      }

      const chosenAccel = await forcedAccel();
      const index = await transcoder.requestTrickplay({
        inputPath: found.path,
        generation: found.generation,
        intervalSeconds: TRICKPLAY_INTERVAL_SECONDS,
        tileWidth: TRICKPLAY_TILE_WIDTH,
        columns: TRICKPLAY_COLUMNS,
        rows: TRICKPLAY_ROWS,
        ...(chosenAccel === '' ? {} : { hardwareAccel: chosenAccel }),
        wait: false,
      });

      if (!index.isReady) {
        return null;
      }

      return {
        id: index.id,
        url: `${trickplayUrlPrefix}/${index.id}/${TRICKPLAY_INDEX_NAME}`,
        intervalSeconds: index.intervalSeconds,
        tileWidth: index.tileWidth,
        tileHeight: index.tileHeight,
      };
    },

    readFrame: async (mediaId, seconds, width) => {
      const found = await media.findForPlayback(mediaId);

      if (found === null) {
        return null;
      }

      return transcoder
        .readFrame({ inputPath: found.path, atSeconds: seconds, width })
        .catch(() => null);
    },

    readPreview: async (mediaId, range) => {
      const found = await media.findForPlayback(mediaId);

      if (found === null) {
        return { kind: 'absent' };
      }

      const chosenAccel = await forcedAccel();
      const clip = await transcoder
        .requestPreview({
          ...previewRequestFor(
            {
              path: found.path,
              audioStreams: found.item.audioStreams,
              previewMoment: found.previewMoment ?? null,
            },
            found.generation,
            found.defaultAudioLanguage,
            await previewQuality(),
          ),
          ...(chosenAccel === '' ? {} : { hardwareAccel: chosenAccel }),
          wait: false,
        })
        .catch(() => null);

      if (clip === null) {
        return { kind: 'absent' };
      }

      if (!clip.isReady) {
        return { kind: 'pending' };
      }

      const file = await transcoder.readPreviewFile(clip.id, PREVIEW_NAME, range);

      return file === null ? { kind: 'pending' } : { kind: 'ready', file };
    },

    readTrickplayFile: (trickplayId, name) => transcoder.readTrickplayFile(trickplayId, name),

    stop: (sessionId, deviceId) => transcoder.stopSession(sessionId, deviceId),

    heartbeat: (sessionId, isPlaying) => transcoder.heartbeatSession(sessionId, isPlaying),
  };
};

export type { CreatePlaybackServiceOptions, MediaLookup };

export { createPlaybackService };
