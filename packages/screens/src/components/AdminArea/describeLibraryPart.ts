import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const PARTS: Record<LibraryPart, { labelKey: StringKey; descriptionKey: StringKey }> = {
  descriptions: {
    labelKey: 'admin.describeLibraryPart.descriptions',
    descriptionKey: 'admin.describeLibraryPart.descriptionsDescription',
  },
  cast: {
    labelKey: 'admin.describeLibraryPart.cast',
    descriptionKey: 'admin.describeLibraryPart.castDescription',
  },
  ageRatings: {
    labelKey: 'admin.describeLibraryPart.ageRatings',
    descriptionKey: 'admin.describeLibraryPart.ageRatingsDescription',
  },
  trailers: {
    labelKey: 'admin.describeLibraryPart.trailers',
    descriptionKey: 'admin.describeLibraryPart.trailersDescription',
  },
  artwork: {
    labelKey: 'admin.describeLibraryPart.artwork',
    descriptionKey: 'admin.describeLibraryPart.artworkDescription',
  },
  logos: {
    labelKey: 'admin.describeLibraryPart.logos',
    descriptionKey: 'admin.describeLibraryPart.logosDescription',
  },
  previews: {
    labelKey: 'admin.describeLibraryPart.previews',
    descriptionKey: 'admin.describeLibraryPart.previewsDescription',
  },
  scrubPreviews: {
    labelKey: 'admin.describeLibraryPart.scrubPreviews',
    descriptionKey: 'admin.describeLibraryPart.scrubPreviewsDescription',
  },
  intros: {
    labelKey: 'admin.describeLibraryPart.intros',
    descriptionKey: 'admin.describeLibraryPart.introsDescription',
  },
  albumCovers: {
    labelKey: 'admin.describeLibraryPart.albumCovers',
    descriptionKey: 'admin.describeLibraryPart.albumCoversDescription',
  },
  artistPictures: {
    labelKey: 'admin.describeLibraryPart.artistPictures',
    descriptionKey: 'admin.describeLibraryPart.artistPicturesDescription',
  },
  lyrics: {
    labelKey: 'admin.describeLibraryPart.lyrics',
    descriptionKey: 'admin.describeLibraryPart.lyricsDescription',
  },
  musicVideos: {
    labelKey: 'admin.describeLibraryPart.musicVideos',
    descriptionKey: 'admin.describeLibraryPart.musicVideosDescription',
  },
};

/**
 * What a part of a library is called, and what clearing it takes away.
 *
 * @param part - The part.
 * @returns Its name, and a line on what it holds.
 */
const describeLibraryPart = (part: LibraryPart): { label: string; description: string } => ({
  label: say(PARTS[part].labelKey),
  description: say(PARTS[part].descriptionKey),
});

export { describeLibraryPart };
