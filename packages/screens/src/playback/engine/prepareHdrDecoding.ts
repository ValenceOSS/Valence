import { readAv1PeakNits } from './av1/readAv1PeakNits';
import { unlabelAv1Obus } from './av1/unlabelAv1Obus';
import { decoderColourOf } from './decoderColourOf';
import { nalsOfPacket } from './hevc/nalsOfPacket';
import { nalsOfRecord } from './hevc/nalsOfRecord';
import { readHevcPeakNits } from './hevc/readHevcPeakNits';
import { unlabelHevcConfig } from './hevc/unlabelHevcConfig';
import { unlabelHevcPacket } from './hevc/unlabelHevcPacket';
import type { HdrSignal } from './HdrSignal';

const PQ = 16;

const HLG = 18;

const BT2020 = 9;

type ContainerColour = {
  primaries?: string | null;
  transfer?: string | null;
  matrix?: string | null;
  fullRange?: boolean | null;
};

type HdrDecoding = {
  config: VideoDecoderConfig;
  rewrite: (packet: Uint8Array) => Uint8Array;
  signal: HdrSignal;
  isWideGamut: boolean;
  peakNits: number | null;
};

/**
 * The bytes a decoder configuration's description holds, whichever form it was given in.
 *
 * @param description - The description.
 * @returns Its bytes, or nothing where there is none.
 */
const bytesOfDescription = (description: AllowSharedBufferSource | undefined): Uint8Array | null =>
  description === undefined
    ? null
    : ArrayBuffer.isView(description)
      ? new Uint8Array(description.buffer, description.byteOffset, description.byteLength)
      : new Uint8Array(description);

/**
 * The signal a transfer number or name stands for, where it is an HDR one.
 *
 * @param transfer - The transfer, as H.273 numbers it or as WebCodecs names it.
 * @returns The signal, or nothing for anything else.
 */
const signalOf = (transfer: number | string | null | undefined): HdrSignal | null =>
  transfer === PQ || transfer === 'pq'
    ? 'pq'
    : transfer === HLG || transfer === 'hlg'
      ? 'hlg'
      : null;

/**
 * How to decode an HDR picture so that its frames reach WebGPU as the signal that was encoded
 * rather than as the browser's own eight-bit conversion of it.
 *
 * A browser converts a frame to its canvas's colours according to what the stream says its colour
 * is, and for PQ or HLG that means its own idea of HDR, clipped. So the stream is told nothing: an
 * H.265 sequence parameter set or an AV1 sequence header — in the configuration and wherever the
 * packets repeat it — says its colour is unspecified, and the decoder is configured to report sRGB
 * primaries and transfer with the stream's real matrix. The browser then only turns YUV into RGB,
 * and every sample arrives as the PQ or HLG value it was encoded as, for the shader to tone map. VP9
 * carries no transfer in its bitstream at all, so its decoder only needs telling.
 *
 * What the picture is comes from the bitstream where it says, and from the container otherwise, and
 * how bright its brightest pixel is from the metadata the stream carries in its first key frame.
 *
 * @param options - The picture's codec and decoder configuration, the colour its container gives,
 *   and its first key frame.
 * @returns How to decode it, or nothing where it is not HDR this can prepare.
 */
const prepareHdrDecoding = ({
  codec,
  config,
  containerColour,
  firstKey,
}: {
  codec: string | null;
  config: VideoDecoderConfig;
  containerColour: ContainerColour;
  firstKey: Uint8Array | null;
}): HdrDecoding | null => {
  const description = bytesOfDescription(config.description);
  const isContainerWide = containerColour.primaries === 'bt2020';
  const isContainerBt2020 = containerColour.matrix === 'bt2020-ncl';

  if (codec === 'hevc') {
    const unlabelled = description === null ? null : unlabelHevcConfig(description);
    const signal = signalOf(unlabelled?.colour.transfer) ?? signalOf(containerColour.transfer);

    if (unlabelled === null || signal === null) {
      return null;
    }

    const { colour, lengthSize } = unlabelled;

    return {
      config: {
        ...config,
        description: unlabelled.record,
        colorSpace: decoderColourOf(
          colour.matrix === BT2020 || (colour.matrix === 2 && isContainerBt2020),
          colour.isFullRange,
        ),
      },
      rewrite: (packet) => unlabelHevcPacket(packet, lengthSize),
      signal,
      isWideGamut: colour.primaries === BT2020 || (colour.primaries === 2 && isContainerWide),
      peakNits: readHevcPeakNits([
        ...nalsOfRecord(description ?? new Uint8Array()),
        ...(firstKey === null ? [] : nalsOfPacket(firstKey, lengthSize)),
      ]),
    };
  }

  if (codec === 'av1') {
    const fromRecord = description === null ? null : unlabelAv1Obus(description.subarray(4));
    const colour =
      fromRecord?.colour ?? (firstKey === null ? null : unlabelAv1Obus(firstKey).colour);
    const signal = signalOf(colour?.transfer) ?? signalOf(containerColour.transfer);

    if (signal === null) {
      return null;
    }

    const record =
      description === null || fromRecord === null
        ? undefined
        : Uint8Array.from([...description.subarray(0, 4), ...fromRecord.obus]);

    return {
      config: {
        ...config,
        ...(record === undefined ? {} : { description: record }),
        colorSpace: decoderColourOf(
          colour?.matrix === BT2020 || ((colour?.matrix ?? 2) === 2 && isContainerBt2020),
          colour?.isFullRange ?? containerColour.fullRange === true,
        ),
      },
      rewrite: (packet) => unlabelAv1Obus(packet).obus,
      signal,
      isWideGamut:
        colour?.primaries === BT2020 || ((colour?.primaries ?? 2) === 2 && isContainerWide),
      peakNits: firstKey === null ? null : readAv1PeakNits(firstKey),
    };
  }

  const signal = codec === 'vp9' ? signalOf(containerColour.transfer) : null;

  if (signal === null) {
    return null;
  }

  return {
    config: {
      ...config,
      colorSpace: decoderColourOf(isContainerBt2020, containerColour.fullRange === true),
    },
    rewrite: (packet) => packet,
    signal,
    isWideGamut: isContainerWide,
    peakNits: null,
  };
};

export type { HdrDecoding };

export { prepareHdrDecoding };
