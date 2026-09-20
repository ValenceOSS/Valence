import { planReencode } from '@ValenceCore/functions/planReencode';
import { selectEncoder } from '@ValenceCore/functions/selectEncoder';
import type { Capabilities } from '@ValenceCore/functions/selectEncoder';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const SEGMENT_SECONDS = 4;

type RenditionVideo =
  | { kind: 'copy' }
  | {
      kind: 'encode';
      encoder: string;
      maxBitrateKbps: number;
      maxWidth: number;
      maxHeight: number;
    };

type RenditionAudioCarry =
  | { kind: 'copy'; streamIndex: number }
  | {
      kind: 'encode';
      streamIndex: number;
      encoder: string;
      channels: number;
      maxBitrateKbps: number;
    };

type RenditionColour = {
  primaries?: string;
  transfer?: string;
  matrix?: string;
  range?: string;
};

type RenditionSpec = {
  spec: {
    inputPath: string;
    startSeconds: number;
    segmentSeconds: number;
    hardwareAccel: string;
    video: RenditionVideo;
    audio: { kind: 'copy' };
    subtitles: { kind: 'none' };
    sourceSize?: [number, number];
    container: 'fmp4';
    sourceVideoCodec?: string;
  };
  carry: {
    audio: RenditionAudioCarry[];
    subtitleStreamIndexes: number[];
    colour: RenditionColour;
    keepsChapters: boolean;
  };
};

type PlanReencodeSpecOutcome =
  { kind: 'ok'; request: RenditionSpec } | { kind: 'unsupported'; reason: string };

type PlanReencodeSpecOptions = {
  item: MediaItem;
  settings: ReencodeSettings;
  inputPath: string;
  capabilities: Capabilities;
  forcedAccel?: string;
  keepsChapters?: boolean;
};

/**
 * Turns what an administrator chose into the instruction the media service runs.
 *
 * The boundary between deciding and doing, the same as [`planToSessionSpec`] is for playback, and
 * split off for the same reason: everything above it reasons about what should exist, and
 * everything below it runs ffmpeg. The encoder is chosen from what this machine actually proved at
 * startup rather than from the codec name, so a request for HEVC on a box whose card cannot encode
 * it is refused here with a reason rather than failing two hours in.
 *
 * Segments are asked for at the length playback uses even though nothing here is segmented. That
 * is what puts keyframes where a session would want them, which is what lets the finished file be
 * cut into segments later by copying rather than by encoding it a second time — a rendition made to
 * avoid transcoding that could not be segmented would not avoid very much.
 *
 * @param options - The file, what was chosen, where it lives, and what this machine can do.
 * @returns What to send the media service, or why it cannot be done here.
 */
const planReencodeSpec = ({
  item,
  settings,
  inputPath,
  capabilities,
  forcedAccel = '',
  keepsChapters = true,
}: PlanReencodeSpecOptions): PlanReencodeSpecOutcome => {
  const plan = planReencode(item, settings);

  const audioEncoders = plan.audioTracks.map((track) =>
    track.kind === 'copy'
      ? null
      : selectEncoder(capabilities, track.codec, forcedAccel, item.videoBitDepth),
  );

  const missingAudio = plan.audioTracks.find(
    (track, at) => track.kind === 'encode' && audioEncoders[at] === null,
  );

  if (missingAudio !== undefined && missingAudio.kind === 'encode') {
    return {
      kind: 'unsupported',
      reason: `This server has no encoder for ${missingAudio.codec} audio.`,
    };
  }

  const carry = {
    audio: plan.audioTracks.map((track, at): RenditionAudioCarry => {
      const chosen = audioEncoders[at];

      if (track.kind === 'copy' || chosen === null || chosen === undefined) {
        return { kind: 'copy', streamIndex: track.index };
      }

      return {
        kind: 'encode',
        streamIndex: track.index,
        encoder: chosen.encoder,
        channels: track.channels,
        maxBitrateKbps: track.maxBitrateKbps,
      };
    }),
    subtitleStreamIndexes: plan.subtitleIndexes,
    colour: {},
    keepsChapters,
  };

  const shared = {
    inputPath,
    startSeconds: 0,
    segmentSeconds: SEGMENT_SECONDS,
    audio: { kind: 'copy' } as const,
    subtitles: { kind: 'none' } as const,
    container: 'fmp4' as const,
    ...(item.videoCodec === '' ? {} : { sourceVideoCodec: item.videoCodec }),
    sourceSize: [item.width, item.height] satisfies [number, number],
  };

  if (plan.video.kind === 'copy') {
    return {
      kind: 'ok',
      request: {
        spec: { ...shared, hardwareAccel: 'none', video: { kind: 'copy' } },
        carry,
      },
    };
  }

  const encoder = selectEncoder(capabilities, plan.video.codec, forcedAccel, item.videoBitDepth);

  if (encoder === null) {
    return {
      kind: 'unsupported',
      reason: `This server has no encoder for ${plan.video.codec} video.`,
    };
  }

  return {
    kind: 'ok',
    request: {
      spec: {
        ...shared,
        hardwareAccel: encoder.accel,
        video: {
          kind: 'encode',
          encoder: encoder.encoder,
          maxBitrateKbps: plan.video.maxBitrateKbps,
          maxWidth: plan.video.maxWidth,
          maxHeight: plan.video.maxHeight,
        },
      },
      carry,
    },
  };
};

export type {
  PlanReencodeSpecOptions,
  PlanReencodeSpecOutcome,
  RenditionAudioCarry,
  RenditionColour,
  RenditionSpec,
  RenditionVideo,
};

export { SEGMENT_SECONDS, planReencodeSpec };
