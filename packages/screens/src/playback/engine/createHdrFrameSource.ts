import { decoderColourOf } from './decoderColourOf';
import { unlabelHevcConfig } from './hevc/unlabelHevcConfig';
import { unlabelHevcPacket } from './hevc/unlabelHevcPacket';
import type { EncodedPacketSink, InputVideoTrack } from 'mediabunny';
import type { HdrSignal } from './HdrSignal';

const PQ = 16;

const HLG = 18;

const BT2020_MATRIX = 9;

const BT2020_PRIMARIES = 9;

const DECODES_AHEAD = 2;

const MICROSECONDS = 1_000_000;

type HdrFrame = { timestamp: number; frame: VideoFrame; close: () => void };

/**
 * Decodes an HDR H.265 picture so that its frames reach WebGPU as the signal that was encoded
 * rather than as the browser's own eight-bit conversion of it.
 *
 * A browser converts a frame to its canvas's colours according to what the stream says its colour
 * is, and for PQ or HLG that means its own idea of HDR, clipped. So the stream is told nothing: its
 * sequence parameter sets — in the configuration record and wherever the packets repeat them — say
 * their colour is unspecified, and the decoder is configured to report sRGB primaries and transfer
 * with the stream's real matrix. The browser then only turns YUV into RGB, and every sample arrives
 * as the PQ or HLG value it was encoded as, for the shader to tone map.
 *
 * Decoding starts at the key frame at or before where it is asked to, passing over frames before
 * that point, and keeps no more than two packets waiting in the decoder.
 *
 * @param track - The picture.
 * @param sink - Where its packets are read from.
 * @returns Where its frames come from and which HDR signal they carry, or nothing where the picture
 *   is not HDR H.265 this can read.
 */
const createHdrFrameSource = async (
  track: Pick<InputVideoTrack, 'codec' | 'getDecoderConfig'>,
  sink: Pick<EncodedPacketSink, 'getKeyPacket' | 'getFirstKeyPacket' | 'packets'>,
): Promise<{
  signal: HdrSignal;
  isWideGamut: boolean;
  samples: (startTimestamp: number) => AsyncGenerator<HdrFrame>;
} | null> => {
  const config = track.codec === 'hevc' ? await track.getDecoderConfig() : null;
  const description =
    config?.description === undefined
      ? null
      : ArrayBuffer.isView(config.description)
        ? new Uint8Array(
            config.description.buffer,
            config.description.byteOffset,
            config.description.byteLength,
          )
        : new Uint8Array(config.description);
  const unlabelled = description === null ? null : unlabelHevcConfig(description);

  if (
    config === null ||
    unlabelled === null ||
    (unlabelled.colour.transfer !== PQ && unlabelled.colour.transfer !== HLG)
  ) {
    return null;
  }

  const configured: VideoDecoderConfig = {
    ...config,
    description: unlabelled.record,
    colorSpace: decoderColourOf(
      unlabelled.colour.matrix === BT2020_MATRIX,
      unlabelled.colour.isFullRange,
    ),
  };

  return {
    signal: unlabelled.colour.transfer === PQ ? 'pq' : 'hlg',
    isWideGamut: unlabelled.colour.primaries === BT2020_PRIMARIES,

    samples: async function* (startTimestamp) {
      const ready: VideoFrame[] = [];
      const state: { wake: (() => void) | null; failure: DOMException | null; isDrained: boolean } =
        { wake: null, failure: null, isDrained: false };
      const nudge = () => {
        state.wake?.();
        state.wake = null;
      };
      const decoder = new VideoDecoder({
        output: (frame) => {
          ready.push(frame);
          nudge();
        },
        error: (failure) => {
          state.failure = failure;
          nudge();
        },
      });
      const first = (await sink.getKeyPacket(startTimestamp)) ?? (await sink.getFirstKeyPacket());
      const packets = sink.packets(first ?? undefined);

      decoder.addEventListener('dequeue', nudge);
      decoder.configure(configured);

      try {
        for (;;) {
          while (ready.length === 0 && state.failure === null && !state.isDrained) {
            if (decoder.decodeQueueSize < DECODES_AHEAD) {
              const next = await packets.next();

              if (next.done === true) {
                await decoder.flush();
                state.isDrained = true;
              } else {
                decoder.decode(
                  new EncodedVideoChunk({
                    type: next.value.type,
                    timestamp: Math.round(next.value.timestamp * MICROSECONDS),
                    duration: Math.round(next.value.duration * MICROSECONDS),
                    data: unlabelHevcPacket(next.value.data, unlabelled.lengthSize),
                  }),
                );
              }
            } else {
              await new Promise<void>((resolve) => {
                state.wake = resolve;
              });
            }
          }

          if (state.failure !== null) {
            throw state.failure;
          }

          const frame = ready.shift();

          if (frame === undefined) {
            return;
          }

          const timestamp = frame.timestamp / MICROSECONDS;

          if (timestamp + (frame.duration ?? 0) / MICROSECONDS <= startTimestamp) {
            frame.close();
          } else {
            yield { timestamp, frame, close: () => frame.close() };
          }
        }
      } finally {
        for (const frame of ready) {
          frame.close();
        }

        if (decoder.state !== 'closed') {
          decoder.close();
        }

        await packets.return(undefined);
      }
    },
  };
};

export type { HdrFrame };

export { createHdrFrameSource };
