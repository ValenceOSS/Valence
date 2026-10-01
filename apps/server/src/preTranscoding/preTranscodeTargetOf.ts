import type { PreTranscodingSettings } from '@ValenceContracts/schemas/PreTranscoding';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

type PreTranscodeRequest = {
  settings: ReencodeSettings;
  key: string;
};

/**
 * What pre-transcoding asks the re-encoder for on these settings — a copy kept beside each film —
 * and the key a remembered refusal is filed under, which changes whenever the copy would.
 *
 * @param settings - The pre-transcoding settings.
 * @returns The request every copy is made from, and its key.
 */
const preTranscodeTargetOf = (settings: PreTranscodingSettings): PreTranscodeRequest => ({
  settings: {
    mode: 'keep',
    quality: settings.quality,
    videoCodec: settings.videoCodec,
    audio: settings.audio,
    container: settings.container,
    placement: 'beside',
    ...(settings.maxBitrateKbps === null ? {} : { maxBitrateKbps: settings.maxBitrateKbps }),
  },
  key: [
    settings.quality,
    settings.videoCodec,
    settings.container,
    settings.maxBitrateKbps?.toString() ?? 'any',
    settings.audio,
  ].join('/'),
});

export type { PreTranscodeRequest };

export { preTranscodeTargetOf };
