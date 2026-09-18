import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';

const PARTS: Record<LibraryPart, { label: string; description: string }> = {
  descriptions: {
    label: 'Descriptions',
    description: 'Overviews, taglines, genres and the catalogue score',
  },
  cast: { label: 'Cast', description: 'Who is in each film and episode, and who they play' },
  ageRatings: {
    label: 'Age ratings',
    description:
      'Certificates, and the ages they allow. Age-limited profiles treat a title as unrated until they are back',
  },
  trailers: {
    label: 'Trailers',
    description: 'Trailers found in the catalogue, not trailer files',
  },
  artwork: {
    label: 'Artwork',
    description: 'Posters, backdrops and episode stills, and the copies kept on this server',
  },
  logos: { label: 'Logos', description: 'The lettering each title is written in' },
  previews: { label: 'Preview clips', description: 'The clips that play when hovering a title' },
  scrubPreviews: {
    label: 'Scrub previews',
    description: 'The pictures shown when dragging along the seek bar',
  },
  intros: {
    label: 'Intros and outros',
    description: 'Detected intros, recaps and credits. Seasons are listened to again',
  },
  albumCovers: { label: 'Album covers', description: 'Covers from tags, folders and the web' },
  artistPictures: { label: 'Artist pictures', description: 'Pictures from folders and the web' },
  lyrics: { label: 'Lyrics', description: 'Lyrics from tags, lyric files and the web' },
  musicVideos: { label: 'Music videos', description: 'Videos found on the web for each song' },
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
