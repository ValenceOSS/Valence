import type { PreTranscodeTarget } from '@ValenceContracts/schemas/PreTranscoding';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

type PreTranscodeRequest = {
  settings: ReencodeSettings;
  key: string;
};

/**
 * What pre-transcoding asks the re-encoder for to make one rung of the ladder — a copy kept beside
 * each film — and the key that rung's copies and refusals are filed under, which changes whenever
 * the copy would.
 *
 * @param target - The rung.
 * @returns The request every copy at that rung is made from, and its key.
 */
const preTranscodeTargetOf = (target: PreTranscodeTarget): PreTranscodeRequest => ({
  settings: {
    mode: 'keep',
    quality: target.quality,
    videoCodec: target.videoCodec,
    audio: target.audio,
    container: target.container,
    placement: 'beside',
    ...(target.maxBitrateKbps === null ? {} : { maxBitrateKbps: target.maxBitrateKbps }),
  },
  key: [
    target.quality,
    target.videoCodec,
    target.container,
    target.maxBitrateKbps?.toString() ?? 'any',
    target.audio,
  ].join('/'),
});

export type { PreTranscodeRequest };

export { preTranscodeTargetOf };
