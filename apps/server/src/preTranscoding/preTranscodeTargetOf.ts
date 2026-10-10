import type { PreTranscodeTarget } from '@ValenceContracts/schemas/PreTranscoding';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

type PreTranscodeRequest = {
  settings: ReencodeSettings;
  key: string;
};

/**
 * What pre-transcoding asks the re-encoder for to make one rung of the ladder — a copy kept beside
 * each film, or for the rung that takes the original's place, a replacement that waits for review —
 * and the key that rung's copies and refusals are filed under, which changes whenever the copy would.
 *
 * @param target - The rung.
 * @param mode - Whether the copy is kept beside the original or replaces it.
 * @returns The request every copy at that rung is made from, and its key.
 */
const preTranscodeTargetOf = (
  target: PreTranscodeTarget,
  mode: 'keep' | 'replace' = 'keep',
): PreTranscodeRequest => ({
  settings: {
    mode,
    quality: target.quality,
    videoCodec: target.videoCodec,
    audio: target.audio,
    container: target.container,
    ...(mode === 'keep' ? { placement: 'beside' as const } : {}),
    ...(target.maxBitrateKbps === null ? {} : { maxBitrateKbps: target.maxBitrateKbps }),
  },
  key: [
    target.quality,
    target.videoCodec,
    target.container,
    target.maxBitrateKbps?.toString() ?? 'any',
    target.audio,
    ...(mode === 'replace' ? ['replace'] : []),
  ].join('/'),
});

export type { PreTranscodeRequest };

export { preTranscodeTargetOf };
