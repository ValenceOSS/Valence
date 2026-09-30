import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

const QUALITY_LABELS: Readonly<Record<Resolution | ReleaseSource | MusicQuality, Said>> = {
  '2160p': sayVerbatim('2160p'),
  '1080p': sayVerbatim('1080p'),
  '720p': sayVerbatim('720p'),
  '576p': sayVerbatim('576p'),
  '480p': sayVerbatim('480p'),
  remux: saying('requests.profiles.qualityLabels.aRemux'),
  bluray: sayVerbatim('Blu-ray'),
  webdl: saying('requests.profiles.qualityLabels.aWebDownload'),
  webrip: saying('requests.profiles.qualityLabels.aWebRip'),
  hdtv: sayVerbatim('HDTV'),
  dvd: sayVerbatim('DVD'),
  telesync: saying('requests.profiles.qualityLabels.aTelesync'),
  cam: saying('requests.profiles.qualityLabels.aCinemaRecording'),
  flac24: sayVerbatim('24-bit FLAC'),
  flac: sayVerbatim('FLAC'),
  alac: sayVerbatim('ALAC'),
  'mp3-320': sayVerbatim('MP3 at 320'),
  'mp3-v0': sayVerbatim('MP3 at V0'),
  aac: sayVerbatim('AAC'),
  opus: sayVerbatim('Opus'),
  'mp3-256': sayVerbatim('MP3 at 256'),
  'mp3-v2': sayVerbatim('MP3 at V2'),
  mp3: sayVerbatim('MP3'),
};

export { QUALITY_LABELS };
