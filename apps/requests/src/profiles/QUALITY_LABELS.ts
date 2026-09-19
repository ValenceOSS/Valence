import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';

const QUALITY_LABELS: Readonly<Record<Resolution | ReleaseSource | MusicQuality, string>> = {
  '2160p': '2160p',
  '1080p': '1080p',
  '720p': '720p',
  '576p': '576p',
  '480p': '480p',
  remux: 'a remux',
  bluray: 'Blu-ray',
  webdl: 'a web download',
  webrip: 'a web rip',
  hdtv: 'HDTV',
  dvd: 'DVD',
  telesync: 'a telesync',
  cam: 'a cinema recording',
  flac24: '24-bit FLAC',
  flac: 'FLAC',
  alac: 'ALAC',
  'mp3-320': 'MP3 at 320',
  'mp3-v0': 'MP3 at V0',
  aac: 'AAC',
  opus: 'Opus',
  'mp3-256': 'MP3 at 256',
  'mp3-v2': 'MP3 at V2',
  mp3: 'MP3',
};

export { QUALITY_LABELS };
