import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import { QUALITY_LABELS } from '@ValenceRequests/profiles/QUALITY_LABELS';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';

const QUALITY_NAMES: Readonly<Record<Resolution | ReleaseSource | MusicQuality, Said>> = {
  ...QUALITY_LABELS,
  remux: saying('requests.profiles.qualityNames.aRemux'),
  webdl: saying('requests.profiles.qualityNames.aWebDownload'),
  webrip: saying('requests.profiles.qualityNames.aWebRip'),
  telesync: saying('requests.profiles.qualityNames.aTelesync'),
  cam: saying('requests.profiles.qualityNames.aCinemaRecording'),
};

export { QUALITY_NAMES };
