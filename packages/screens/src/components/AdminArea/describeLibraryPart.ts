import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import { say } from '@ValenceI18n/say';

const PARTS: Record<LibraryPart, { label: string; description: string }> = {
  descriptions: {
    label: say('screens.adminArea.describeLibraryPart.descriptions'),
    description: say(
      'screens.adminArea.describeLibraryPart.overviewsTaglinesGenresAndTheCatalogue',
    ),
  },
  cast: {
    label: say('common.cast'),
    description: say('screens.adminArea.describeLibraryPart.whoIsInEachFilmAnd'),
  },
  ageRatings: {
    label: say('screens.adminArea.describeLibraryPart.ageRatings'),
    description: say('screens.adminArea.describeLibraryPart.certificatesAndTheAgesTheyAllow'),
  },
  trailers: {
    label: say('screens.adminArea.describeLibraryPart.trailers'),
    description: say('screens.adminArea.describeLibraryPart.trailersFoundInTheCatalogueNot'),
  },
  artwork: {
    label: say('common.artwork'),
    description: say('screens.adminArea.describeLibraryPart.postersBackdropsAndEpisodeStillsAnd'),
  },
  logos: {
    label: say('screens.adminArea.describeLibraryPart.logos'),
    description: say('screens.adminArea.describeLibraryPart.theLetteringEachTitleIsWritten'),
  },
  previews: {
    label: say('common.previewClips'),
    description: say('screens.adminArea.describeLibraryPart.theClipsThatPlayWhenHovering'),
  },
  scrubPreviews: {
    label: say('screens.adminArea.describeLibraryPart.scrubPreviews'),
    description: say('screens.adminArea.describeLibraryPart.thePicturesShownWhenDraggingAlong'),
  },
  intros: {
    label: say('screens.adminArea.describeLibraryPart.introsAndOutros'),
    description: say('screens.adminArea.describeLibraryPart.detectedIntrosRecapsAndCreditsSeasons'),
  },
  albumCovers: {
    label: say('screens.adminArea.describeLibraryPart.albumCovers'),
    description: say('screens.adminArea.describeLibraryPart.coversFromTagsFoldersAndThe'),
  },
  artistPictures: {
    label: say('screens.adminArea.describeLibraryPart.artistPictures'),
    description: say('screens.adminArea.describeLibraryPart.picturesFromFoldersAndTheWeb'),
  },
  lyrics: {
    label: say('common.lyrics'),
    description: say('screens.adminArea.describeLibraryPart.lyricsFromTagsLyricFilesAnd'),
  },
  musicVideos: {
    label: say('screens.adminArea.describeLibraryPart.musicVideos'),
    description: say('screens.adminArea.describeLibraryPart.videosFoundOnTheWebFor'),
  },
};

/**
 * What a part of a library is called, and what clearing it takes away.
 *
 * @param part - The part.
 * @returns Its name, and a line on what it holds.
 */
const describeLibraryPart = (part: LibraryPart): { label: string; description: string } =>
  PARTS[part];

export { describeLibraryPart };
