import { prepareHdrDecoding } from './prepareHdrDecoding';
import type { EncodedPacketSink, InputVideoTrack } from 'mediabunny';
import type { HdrSignal } from './HdrSignal';

const DECODES_AHEAD = 2;

const MICROSECONDS = 1_000_000;

type HdrFrame = { timestamp: number; frame: VideoFrame; close: () => void };

/**
 * Decodes an HDR H.265, AV1 or VP9 picture so that its frames reach WebGPU as the signal that was
 * encoded rather than as the browser's own eight-bit conversion of it — see `prepareHdrDecoding` —
 * and reads how bright its brightest pixel is, for the tone mapping to roll off from.
 *
 * Decoding starts at the key frame at or before where it is asked to, passing over frames before
 * that point, and keeps no more than two packets waiting in the decoder.
 *
 * @param track - The picture.
 * @param sink - Where its packets are read from.
 * @returns Where its frames come from and what HDR they carry, or nothing where the picture is not
 *   HDR this can decode untouched.
 */
const createHdrFrameSource = async (
  track: Pick<InputVideoTrack, 'codec' | 'getDecoderConfig' | 'getColorSpace'>,
  sink: Pick<EncodedPacketSink, 'getKeyPacket' | 'getFirstKeyPacket' | 'packets'>,
): Promise<{
  signal: HdrSignal;
  isWideGamut: boolean;
  peakNits: number | null;
  samples: (startTimestamp: number) => AsyncGenerator<HdrFrame>;
} | null> => {
  const config = await track.getDecoderConfig();

  if (config === null || !['hevc', 'av1', 'vp9'].includes(track.codec ?? '')) {
    return null;
  }

  const firstKey = await sink.getFirstKeyPacket().catch(() => null);
  const prepared = prepareHdrDecoding({
    codec: track.codec,
    config,
    containerColour: await track.getColorSpace(),
    firstKey: firstKey?.data ?? null,
  });

  if (prepared === null) {
    return null;
  }

  return {
    signal: prepared.signal,
    isWideGamut: prepared.isWideGamut,
    peakNits: prepared.peakNits,

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
      decoder.configure(prepared.config);

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
                    data: prepared.rewrite(next.value.data),
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
