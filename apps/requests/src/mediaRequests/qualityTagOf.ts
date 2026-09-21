import type {
  AudioCodec,
  ParsedRelease,
  ReleaseSource,
  VideoCodec,
} from '@ValenceContracts/schemas/ParsedRelease';

const SOURCE_TAGS: Readonly<Record<ReleaseSource, string>> = {
  remux: 'Remux',
  bluray: 'Bluray',
  webdl: 'WEBDL',
  webrip: 'WEBRip',
  hdtv: 'HDTV',
  dvd: 'DVD',
  telesync: 'TELESYNC',
  cam: 'CAM',
};

const VIDEO_TAGS: Readonly<Record<VideoCodec, string>> = {
  h266: 'x266',
  av1: 'AV1',
  h265: 'x265',
  h264: 'x264',
  xvid: 'XviD',
  mpeg2: 'MPEG2',
};

const AUDIO_TAGS: Readonly<Record<AudioCodec, string>> = {
  atmos: 'Atmos',
  truehd: 'TrueHD',
  dtsx: 'DTS-X',
  dtsHdMa: 'DTS-HD MA',
  dts: 'DTS',
  eac3: 'EAC3',
  ac3: 'AC3',
  flac: 'FLAC',
  aac: 'AAC',
  opus: 'Opus',
  mp3: 'MP3',
  pcm: 'PCM',
};

/**
 * How a release's audio is named: the codec carrying it, with Atmos after the codec it rides on
 * rather than in place of it, and the channel layout where the name gave one.
 *
 * @param audio - The codecs the release names, best first.
 * @param channels - The channel layout, where it names one.
 * @returns The name, or nothing where no codec was named.
 */
const audioTagOf = (audio: readonly AudioCodec[], channels: string | null): string => {
  const carrying = audio.find((codec) => codec !== 'atmos') ?? null;
  const named =
    carrying === null
      ? audio.includes('atmos')
        ? AUDIO_TAGS.atmos
        : ''
      : `${AUDIO_TAGS[carrying]}${audio.includes('atmos') ? ` ${AUDIO_TAGS.atmos}` : ''}`;

  if (named === '') {
    return '';
  }

  return channels === null ? named : `${named} ${channels}`;
};

/**
 * What a file is, said in its own name the way release names say it: its resolution, where it came
 * from, the codec it is in and the audio it carries, each bracketed, and left out where the release
 * never said.
 *
 * This goes on the file and never on the folder it sits in. A folder names the film or the series,
 * which is what a library scanner matches against a catalogue; the file names this copy of it, so
 * two copies of one episode differ by their names rather than by nothing at all, and an upgrade is
 * filed beside what it replaces rather than over it.
 *
 * @param parsed - What the name it came from says it is.
 * @returns The tag, starting with a space, or nothing where the name said none of it.
 */
const qualityTagOf = (parsed: ParsedRelease): string => {
  const audio = audioTagOf(parsed.audio, parsed.audioChannels);
  const parts = [
    parsed.resolution ?? '',
    parsed.source === null ? '' : SOURCE_TAGS[parsed.source],
    parsed.codec === null ? '' : VIDEO_TAGS[parsed.codec],
    audio,
  ].flatMap((part) => (part === '' ? [] : [`[${part}]`]));

  return parts.length === 0 ? '' : ` ${parts.join('')}`;
};

export { qualityTagOf };
