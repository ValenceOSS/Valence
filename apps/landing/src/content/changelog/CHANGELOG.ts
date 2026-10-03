import { dialogsSideBySide } from './dialogsSideBySide';
import { facesAndArtCards } from './facesAndArtCards';
import { linkedServersAndCalendars } from './linkedServersAndCalendars';
import { musicRequestsAndHouseholds } from './musicRequestsAndHouseholds';
import { patchedImages } from './patchedImages';
import { phonesAndAudiobooks } from './phonesAndAudiobooks';
import { steadierTests } from './steadierTests';
import { subtitlesAndTheSite } from './subtitlesAndTheSite';
import { theFirstRelease } from './theFirstRelease';
import type { ChangelogEntry } from './ChangelogEntry';

const CHANGELOG: readonly ChangelogEntry[] = [
  linkedServersAndCalendars,
  facesAndArtCards,
  steadierTests,
  patchedImages,
  phonesAndAudiobooks,
  musicRequestsAndHouseholds,
  subtitlesAndTheSite,
  dialogsSideBySide,
  theFirstRelease,
];

export { CHANGELOG };
