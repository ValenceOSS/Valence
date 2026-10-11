import { splitPictures } from './splitPictures';
import type { EncodedPacket, EncodedPacketSink } from 'mediabunny';
import type { Mpeg2Worker } from './createMpeg2Worker';

const MICROSECONDS = 1_000_000;

type Mpeg2Frame = { timestamp: number; frame: VideoFrame; close: () => void };

/**
 * Joins byte runs into one.
 *
 * @param parts - The runs.
 * @returns Them, one after another.
 */
const joined = (parts: readonly Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;

  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }

  return out;
};

/**
 * A group of pictures with its B-pictures taken out, leaving only the reference pictures the next
 * group's leading B-pictures are predicted from.
 *
 * @param group - The group's elementary stream.
 * @returns The stream of its sequence header and reference pictures.
 */
const referencesOf = (group: Uint8Array): Uint8Array =>
  joined(
    splitPictures(group)
      .filter((unit) => !unit.isBidirectional)
      .map((unit) => group.subarray(unit.start, unit.end)),
  );

/**
 * A group of pictures with the B-pictures before its first P-picture taken out, which are predicted
 * from a previous group this one has not got — so the first group after a seek decodes at all.
 *
 * @param group - The group's elementary stream.
 * @returns The stream without those pictures.
 */
const withoutLeadingBidirectional = (group: Uint8Array): Uint8Array => {
  const units = splitPictures(group);
  const pictures = units.filter((unit) => unit.isPicture);
  const firstForward = pictures.findIndex((unit, index) => index > 0 && !unit.isBidirectional);
  const dropped = new Set(
    pictures.filter(
      (unit, index) => unit.isBidirectional && (firstForward === -1 || index < firstForward),
    ),
  );

  return joined(
    units.filter((unit) => !dropped.has(unit)).map((unit) => group.subarray(unit.start, unit.end)),
  );
};

/**
 * Decodes MPEG-2 video — which no browser decodes — through Valence's own WebAssembly decoder, a
 * group of pictures at a time, into frames the browser's own player can draw.
 *
 * Most MPEG-2 groups are open: their first B-pictures are predicted from the previous group's last
 * reference picture. So each group is decoded behind the previous group's reference pictures, its
 * B-pictures taken out, and only the group's own frames are kept, each given its packet's time in
 * display order. A group arriving without a sequence header is given the last one seen, and the
 * first group after a seek, with nothing before it, loses the leading B-pictures it cannot decode.
 *
 * @param sink - Where the picture's packets are read from.
 * @param decoder - Valence's WebAssembly MPEG-2 decoder, running in a worker of its own.
 * @param colourSpace - The colour the frames are in, as the container says.
 * @returns Where its frames come from.
 */
const createMpeg2FrameSource = (
  sink: Pick<EncodedPacketSink, 'getKeyPacket' | 'getFirstKeyPacket' | 'packets'>,
  decoder: Pick<Mpeg2Worker, 'decode' | 'reset'>,
  colourSpace: VideoColorSpaceInit,
): { samples: (startTimestamp: number) => AsyncGenerator<Mpeg2Frame> } => ({
  samples: async function* (startTimestamp) {
    decoder.reset();
    const state: { header: Uint8Array | null; previous: Uint8Array | null } = {
      header: null,
      previous: null,
    };

    const decodeGroup = async (packets: readonly EncodedPacket[]): Promise<Mpeg2Frame[]> => {
      const raw = joined(packets.map((packet) => packet.data));
      const units = splitPictures(raw);
      const header = units.find((unit) => unit.isSequenceHeader);

      if (header !== undefined) {
        state.header = raw.subarray(
          header.start,
          units.find((unit) => unit.isPicture)?.start ?? header.end,
        );
      }

      const whole =
        header === undefined && state.header !== null ? joined([state.header, raw]) : raw;
      const group = state.previous === null ? withoutLeadingBidirectional(whole) : whole;
      const pictures = splitPictures(group).filter((unit) => unit.isPicture).length;
      const decoded = await decoder.decode(
        state.previous === null ? group : joined([referencesOf(state.previous), group]),
      );

      state.previous = whole;

      const kept = Math.min(pictures, decoded.count);
      const size = decoded.width * decoded.height * 1.5;
      const times = packets
        .map((packet) => packet.timestamp)
        .sort((left, right) => left - right)
        .slice(-kept);
      const lasts = times.length > 1 ? (times.at(-1) ?? 0) - (times.at(-2) ?? 0) : 0;

      return Array.from({ length: kept }, (_, index) => {
        const at = (decoded.count - kept + index) * size;
        const timestamp = times[index] ?? (times.at(-1) ?? 0) + lasts * (index - times.length + 1);
        const frame = new VideoFrame(decoded.frames.subarray(at, at + size), {
          format: 'I420',
          codedWidth: decoded.width,
          codedHeight: decoded.height,
          timestamp: Math.round(timestamp * MICROSECONDS),
          duration: Math.round(lasts * MICROSECONDS),
          colorSpace: colourSpace,
        });

        return { timestamp, frame, close: () => frame.close() };
      });
    };

    const first = (await sink.getKeyPacket(startTimestamp)) ?? (await sink.getFirstKeyPacket());
    const pending: EncodedPacket[] = [];

    try {
      for await (const packet of first === null ? [] : sink.packets(first)) {
        if (packet.type === 'key' && pending.length > 0) {
          for (const decoded of await decodeGroup(pending.splice(0))) {
            if (decoded.timestamp + (decoded.frame.duration ?? 0) / MICROSECONDS < startTimestamp) {
              decoded.close();
            } else {
              yield decoded;
            }
          }
        }

        pending.push(packet);
      }

      for (const decoded of pending.length === 0 ? [] : await decodeGroup(pending.splice(0))) {
        yield decoded;
      }
    } finally {
      decoder.reset();
    }
  },
});

export type { Mpeg2Frame };

export { createMpeg2FrameSource };
