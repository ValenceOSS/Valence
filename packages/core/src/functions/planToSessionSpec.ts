import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import { selectEncoder } from '@ValenceCore/functions/selectEncoder';
import type { Capabilities } from '@ValenceCore/functions/selectEncoder';
import type { SegmentContainer } from './segmentContainerFor';
import { say } from '@ValenceI18n/say';

type ToneMapping = 'zscale' | 'libplacebo' | 'unavailable';

type SessionSpec = {
  inputPath: string;
  startSeconds: number;
  segmentSeconds: number;
  hardwareAccel: string;
  video:
    | { kind: 'copy' }
    | {
        kind: 'encode';
        encoder: string;
        maxBitrateKbps: number;
        maxWidth: number;
        maxHeight: number;
        toneMap?: ToneMapping;
        deinterlace?: boolean;
        squarePixels?: boolean;
      };
  audio:
    | { kind: 'copy' }
    | { kind: 'encode'; encoder: string; channels: number; maxBitrateKbps: number };
  audioStreamIndex?: number;
  subtitles:
    | { kind: 'none' }
    | {
        kind: 'burnIn';
        subtitleIndex: number;
        isImageBased: boolean;
      };
  sourceSize?: [number, number];
  container: SegmentContainer;
  sourceVideoCodec?: string;
};

type PlanToSessionSpecOptions = {
  plan: PlaybackPlan;
  inputPath: string;
  sourceRange: string;
  sourceSize?: [number, number];
  imageSubtitleIndexes?: number[];
  subtitleIndexes?: number[];
  capabilities: Capabilities;
  forcedAccel?: string;
  startSeconds: number;
  segmentSeconds: number;
  audioStreamIndex?: number;
  container: SegmentContainer;
  sourceVideoCodec?: string;
  sourceBitDepth?: number;
  sourceIsInterlaced?: boolean;
  sourcePixelAspect?: string | null;
};

type SpecOutcome =
  | {
      kind: 'ok';
      spec: SessionSpec;
      warnings: string[];
      deliveredRange: string;
    }
  | { kind: 'unsupported'; reason: string };

const HDR_RANGES = new Set(['HDR10', 'HDR10Plus', 'HLG', 'DolbyVision']);

/**
 * Decides whether a transcode has to convert HDR to SDR, and whether this server can actually do
 * it. A conversion the hardware cannot manage is not refused — the picture is still delivered, with
 * a warning saying it will look flat, since a washed-out film is better than no film.
 *
 * @param sourceRange - The range the file is graded in.
 * @param targetRange - The range being encoded to.
 * @param capability - What tone mapping this server has available.
 * @returns The tone mapping to apply where one is both needed and possible, and any warnings.
 */
const planToneMapping = (
  sourceRange: string,
  targetRange: string,
  capability: ToneMapping,
): { toneMap?: ToneMapping; warnings: string[]; deliveredRange: string } => {
  const converting = HDR_RANGES.has(sourceRange) && !HDR_RANGES.has(targetRange);

  if (!converting) {
    return { warnings: [], deliveredRange: targetRange };
  }

  if (capability === 'unavailable') {
    return {
      deliveredRange: sourceRange,
      warnings: [say('core.planToSessionSpec.cannotToneMap', { range: sourceRange })],
    };
  }

  return { toneMap: capability, warnings: [], deliveredRange: targetRange };
};

const AUDIO_ENCODER = 'aac';

/**
 * Turns a negotiated plan into the instruction the media service actually runs: which file, which
 * encoder, what ceilings, which streams, where to start and how long each segment should be. This
 * is the boundary between deciding and doing — everything above it reasons about what a client can
 * play, and everything below it runs ffmpeg.
 *
 * @param options - The plan, the file it applies to, this server's capabilities, and the session's own particulars: where to start, how long segments run, and which audio and subtitle streams were asked for.
 * @returns The session specification, and any warnings worth showing an operator.
 */
const planToSessionSpec = ({
  plan,
  inputPath,
  sourceRange,
  sourceSize,
  capabilities,
  forcedAccel = '',
  startSeconds,
  segmentSeconds,
  audioStreamIndex,
  imageSubtitleIndexes = [],
  subtitleIndexes = [],
  container,
  sourceVideoCodec,
  sourceBitDepth,
  sourceIsInterlaced = false,
  sourcePixelAspect = null,
}: PlanToSessionSpecOptions): SpecOutcome => {
  const isImageBased =
    plan.subtitles.kind === 'burnIn' && imageSubtitleIndexes.includes(plan.subtitles.streamIndex);

  const canBurn = isImageBased
    ? capabilities.canBurnImageSubtitles !== false
    : capabilities.canBurnTextSubtitles !== false;

  const subtitleWarnings =
    plan.subtitles.kind === 'burnIn' && !canBurn
      ? [
          isImageBased
            ? say('core.planToSessionSpec.cannotBurnImageSubtitles')
            : say('core.planToSessionSpec.cannotBurnTextSubtitles'),
        ]
      : [];

  const mustBurnIn = plan.subtitles.kind === 'burnIn' && canBurn;

  const subtitles: SessionSpec['subtitles'] =
    plan.subtitles.kind === 'burnIn' && canBurn
      ? {
          kind: 'burnIn',
          subtitleIndex: Math.max(0, subtitleIndexes.indexOf(plan.subtitles.streamIndex)),
          isImageBased,
        }
      : { kind: 'none' };
  const needsVideoEncode = plan.video.kind === 'transcode' || mustBurnIn;

  if (!needsVideoEncode) {
    return {
      kind: 'ok',
      warnings: subtitleWarnings,
      deliveredRange: sourceRange,
      spec: {
        inputPath,
        startSeconds,
        segmentSeconds,
        hardwareAccel: 'none',
        container,
        subtitles,
        ...(sourceSize === undefined ? {} : { sourceSize }),
        ...(sourceVideoCodec === undefined ? {} : { sourceVideoCodec }),
        ...(audioStreamIndex === undefined ? {} : { audioStreamIndex }),
        video: { kind: 'copy' },
        audio:
          plan.audio.kind === 'transcode'
            ? {
                kind: 'encode',
                encoder: AUDIO_ENCODER,
                channels: plan.audio.channels,
                maxBitrateKbps: plan.audio.maxBitrateKbps,
              }
            : { kind: 'copy' },
      },
    };
  }

  const targetCodec = plan.video.kind === 'transcode' ? plan.video.codec : 'h264';
  const chosen =
    selectEncoder(capabilities, targetCodec, forcedAccel, sourceBitDepth) ??
    selectEncoder(capabilities, 'h264', forcedAccel, sourceBitDepth);

  if (chosen === null) {
    return {
      kind: 'unsupported',
      reason: say('core.planToSessionSpec.noEncoder', { codec: targetCodec }),
    };
  }

  const limits =
    plan.video.kind === 'transcode'
      ? {
          maxBitrateKbps: plan.video.maxBitrateKbps,
          maxWidth: plan.video.maxWidth,
          maxHeight: plan.video.maxHeight,
        }
      : { maxBitrateKbps: 8000, maxWidth: 1920, maxHeight: 1080 };

  const targetRange = plan.video.kind === 'transcode' ? plan.video.range : sourceRange;
  const mapping = planToneMapping(
    sourceRange,
    targetRange,
    capabilities.toneMapping ?? 'unavailable',
  );

  return {
    kind: 'ok',
    warnings: [...mapping.warnings, ...subtitleWarnings],
    deliveredRange: mapping.deliveredRange,
    spec: {
      inputPath,
      startSeconds,
      segmentSeconds,
      hardwareAccel: chosen.accel,
      container,
      subtitles,
      ...(sourceSize === undefined ? {} : { sourceSize }),
      ...(audioStreamIndex === undefined ? {} : { audioStreamIndex }),
      video: {
        kind: 'encode',
        encoder: chosen.encoder,
        ...limits,
        ...(mapping.toneMap === undefined ? {} : { toneMap: mapping.toneMap }),
        ...(sourceIsInterlaced ? { deinterlace: true } : {}),
        ...(sourcePixelAspect === null ? {} : { squarePixels: true }),
      },
      audio:
        plan.audio.kind === 'transcode'
          ? {
              kind: 'encode',
              encoder: AUDIO_ENCODER,
              channels: plan.audio.channels,
              maxBitrateKbps: plan.audio.maxBitrateKbps,
            }
          : { kind: 'copy' },
    },
  };
};

export type { Capabilities, SessionSpec };

export { planToSessionSpec, selectEncoder };
