import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';

const QUALITY_NAMES: Readonly<Record<Resolution | ReleaseSource | MusicQuality, string>> = {
  '2160p': '2160p',
  '1080p': '1080p',
  '720p': '720p',
  '576p': '576p',
  '480p': '480p',
  remux: 'Remux',
  bluray: 'Blu-ray',
  webdl: 'WEB-DL',
  webrip: 'WEBRip',
  hdtv: 'HDTV',
  dvd: 'DVD',
  telesync: 'Telesync',
  cam: 'Cam',
  flac24: '24-bit FLAC',
  flac: 'FLAC',
  alac: 'ALAC',
  'mp3-320': 'MP3 320',
  'mp3-v0': 'MP3 V0',
  aac: 'AAC',
  opus: 'Opus',
  'mp3-256': 'MP3 256',
  'mp3-v2': 'MP3 V2',
  mp3: 'MP3',
};

export { QUALITY_NAMES };
