import type { EngineSupport } from './EngineSupport';
import type { EnginesBrowser } from './EnginesBrowser';
import type { ToneMappingCheck } from './ToneMappingCheck';

const VIDEO_PROBES = [
  { codec: 'h264', config: 'avc1.640033' },
  { codec: 'hevc', config: 'hvc1.1.6.L153.B0' },
  { codec: 'av1', config: 'av01.0.13M.08' },
  { codec: 'vp9', config: 'vp09.00.41.08' },
  { codec: 'vp8', config: 'vp8' },
] as const;

const TEN_BIT_VIDEO_PROBES = [
  { codec: 'hevc', config: 'hvc1.2.4.L153.B0' },
  { codec: 'av1', config: 'av01.0.13M.10' },
  { codec: 'vp9', config: 'vp09.02.41.10' },
] as const;

const REMUXED_VIDEO = [
  { codec: 'h264', mimeType: 'video/mp4; codecs="avc1.640033"' },
  { codec: 'hevc', mimeType: 'video/mp4; codecs="hvc1.1.6.L153.B0"' },
  { codec: 'av1', mimeType: 'video/mp4; codecs="av01.0.13M.08"' },
  { codec: 'vp9', mimeType: 'video/mp4; codecs="vp09.00.41.08"' },
] as const;

const REMUXED_TEN_BIT_VIDEO = [
  { codec: 'hevc', mimeType: 'video/mp4; codecs="hvc1.2.4.L153.B0"' },
  { codec: 'av1', mimeType: 'video/mp4; codecs="av01.0.13M.10"' },
  { codec: 'vp9', mimeType: 'video/mp4; codecs="vp09.02.41.10"' },
] as const;

const CARRIED_AUDIO = [
  { codec: 'aac', mimeType: 'audio/mp4; codecs="mp4a.40.2"' },
  { codec: 'opus', mimeType: 'audio/mp4; codecs="opus"' },
  { codec: 'flac', mimeType: 'audio/mp4; codecs="flac"' },
  { codec: 'mp3', mimeType: 'audio/mp4; codecs="mp3"' },
  { codec: 'ac3', mimeType: 'audio/mp4; codecs="ac-3"' },
  { codec: 'eac3', mimeType: 'audio/mp4; codecs="ec-3"' },
] as const;

const DECODED_AUDIO = [
  { codec: 'aac', config: 'mp4a.40.2' },
  { codec: 'opus', config: 'opus' },
  { codec: 'flac', config: 'flac' },
  { codec: 'mp3', config: 'mp3' },
  { codec: 'vorbis', config: 'vorbis' },
] as const;

const DECODED_IN_THE_PAGE = ['ac3', 'eac3', 'dts', 'pcm'] as const;

const LOSSLESS_AS = 'audio/mp4; codecs="flac"';

const DECODED_BY_VALENCE = ['truehd'] as const;

const PICTURES_DECODED_BY_VALENCE = ['mpeg2'] as const;

const RE_ENCODED_AS = 'audio/mp4; codecs="opus"';

const UHD = { codedWidth: 3840, codedHeight: 2160 };

const NOTHING: EngineSupport = {
  videoCodecs: [],
  tenBitVideoCodecs: [],
  remuxVideoCodecs: [],
  remuxTenBitVideoCodecs: [],
  toneMappedCodecs: [],
  toneMappingChecks: {},
  audioCodecs: [],
};

/**
 * Asks a probe without letting a browser that throws, rather than answering no, spoil the rest.
 *
 * @param asking - The question.
 * @returns The answer, or no where asking failed.
 */
const answerOf = async (asking: () => Promise<boolean>): Promise<boolean> => {
  try {
    return await asking();
  } catch {
    return false;
  }
};

/**
 * Runs a browser's tone mapping check for a codec without letting one that throws spoil the rest,
 * keeping what it threw as the reason.
 *
 * @param check - The browser's check.
 * @param codec - The codec, as Valence names it.
 * @returns How the check went.
 */
const toneMappingCheckOf = async (
  check: (codec: string) => Promise<ToneMappingCheck>,
  codec: string,
): Promise<ToneMappingCheck> => {
  try {
    return await check(codec);
  } catch (error) {
    return { outcome: 'failed', reason: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * What this browser can play beyond what the media element plays from a file by itself, by asking
 * each decoder rather than reading the browser's name: the pictures its own player decodes with
 * WebCodecs and draws with WebGPU, the pictures the element decodes once a file is repackaged here
 * into fragmented MP4, which 10-bit pictures can be decoded here and reach WebGPU untouched for
 * Valence to tone map — proven by the browser rather than assumed, since not every browser honours
 * the colour a decoder is told, and kept with how each check went so the player can say why it was
 * not used — and the sounds either can be given.
 *
 * A picture counts for the player where WebCodecs decodes it at 4K, and for repackaging where Media
 * Source Extensions take it in MP4. A sound counts where the media element takes it
 * repackaged into fragmented MP4 as it is, or where it can be decoded here and handed on — as
 * lossless FLAC wherever the element takes it, Valence bringing its own encoder, or else as Opus
 * where this browser encodes it. AC-3, E-AC-3, DTS and PCM are decoded in the page whatever the
 * browser says, which is how Dolby and DTS play in a browser that has neither of its own, and TrueHD
 * where Valence's own WebAssembly decoders were built and the element takes FLAC to hand it on in;
 * those decoders also bring MPEG-2 pictures, drawn by the browser's own player. Nothing is claimed without a GPU,
 * a secure page and somewhere to put the sound, since the player needs all three.
 *
 * @param browser - What this browser offers.
 * @returns The codecs it can play through its own player, or none.
 */
const detectEngineSupport = async (browser: EnginesBrowser): Promise<EngineSupport> => {
  const { canDecodeVideo, canDecodeAudio, canEncodeAudio, canStream } = browser;

  if (
    !browser.isSecureContext ||
    canDecodeVideo === null ||
    canStream === null ||
    !(await answerOf(browser.hasGpu))
  ) {
    return NOTHING;
  }

  const decodes = async (probes: readonly { codec: string; config: string }[]) =>
    (
      await Promise.all(
        probes.map(async ({ codec, config }) =>
          (await answerOf(() => canDecodeVideo({ codec: config, ...UHD }))) ? [codec] : [],
        ),
      )
    ).flat();

  const carried = CARRIED_AUDIO.filter(({ mimeType }) => canStream(mimeType)).map(
    ({ codec }) => codec,
  );
  const canReEncode =
    canStream(LOSSLESS_AS) ||
    (canStream(RE_ENCODED_AS) &&
      canEncodeAudio !== null &&
      (await answerOf(() =>
        canEncodeAudio({
          codec: 'opus',
          sampleRate: 48_000,
          numberOfChannels: 2,
          bitrate: 192_000,
        }),
      )));
  const decoded =
    !canReEncode || canDecodeAudio === null
      ? []
      : (
          await Promise.all(
            DECODED_AUDIO.map(async ({ codec, config }) =>
              (await answerOf(() =>
                canDecodeAudio({ codec: config, sampleRate: 48_000, numberOfChannels: 2 }),
              ))
                ? [codec]
                : [],
            ),
          )
        ).flat();
  const hasDecoders = await answerOf(browser.hasDecoders);
  const hasOwnDecoders = canStream(LOSSLESS_AS) && hasDecoders;
  const audioCodecs = [
    ...new Set([
      ...carried,
      ...decoded,
      ...(canReEncode ? DECODED_IN_THE_PAGE : []),
      ...(hasOwnDecoders ? DECODED_BY_VALENCE : []),
    ]),
  ];
  const videoCodecs = [
    ...(await decodes(VIDEO_PROBES)),
    ...(hasDecoders ? PICTURES_DECODED_BY_VALENCE : []),
  ];

  const remuxVideoCodecs = REMUXED_VIDEO.filter(({ mimeType }) => canStream(mimeType)).map(
    ({ codec }) => codec,
  );
  const tenBitVideoCodecs = await decodes(TEN_BIT_VIDEO_PROBES);
  const { checkToneMapping } = browser;
  const toneMappingChecks: Partial<Record<string, ToneMappingCheck>> =
    checkToneMapping === null
      ? {}
      : Object.fromEntries(
          await Promise.all(
            TEN_BIT_VIDEO_PROBES.map(async ({ codec }): Promise<[string, ToneMappingCheck]> => [
              codec,
              tenBitVideoCodecs.includes(codec)
                ? await toneMappingCheckOf(checkToneMapping, codec)
                : { outcome: 'notDecodable' },
            ]),
          ),
        );

  return (videoCodecs.length === 0 && remuxVideoCodecs.length === 0) || audioCodecs.length === 0
    ? NOTHING
    : {
        videoCodecs,
        tenBitVideoCodecs,
        remuxVideoCodecs,
        remuxTenBitVideoCodecs: REMUXED_TEN_BIT_VIDEO.filter(({ mimeType }) =>
          canStream(mimeType),
        ).map(({ codec }) => codec),
        toneMappedCodecs: Object.entries(toneMappingChecks)
          .filter(([, check]) => check?.outcome === 'trusted')
          .map(([codec]) => codec),
        toneMappingChecks,
        audioCodecs,
      };
};

export { detectEngineSupport };
