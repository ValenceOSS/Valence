import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import { say } from '@ValenceI18n/say';

const QUALITY_NAMES: Readonly<Record<Resolution | ReleaseSource | MusicQuality, string>> = {
  '2160p': '2160p',
  '1080p': '1080p',
  '720p': '720p',
  '576p': '576p',
  '480p': '480p',
  remux: say('common.remux'),
  bluray: 'Blu-ray',
  webdl: 'WEB-DL',
  webrip: 'WEBRip',
  hdtv: 'HDTV',
  dvd: 'DVD',
  telesync: say('screens.adminArea.qualityNames.telesync'),
  cam: say('screens.adminArea.qualityNames.cam'),
  flac24: '24-bit FLAC',
  flac: 'FLAC',
  alac: 'ALAC',
  'mp3-320': 'MP3 320',
  'mp3-v0': 'MP3 V0',
  aac: 'AAC',
  opus: say('common.opus'),
  'mp3-256': 'MP3 256',
  'mp3-v2': 'MP3 V2',
  mp3: 'MP3',
};

export { QUALITY_NAMES };
