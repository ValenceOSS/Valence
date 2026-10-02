/**
 * Turns a rating out of ten, as Jellyfin, Emby and Plex keep one, into Valence's one to five stars.
 *
 * @param rating - The rating out of ten.
 * @returns The stars, or null where there was no rating.
 */
const starsOf = (rating: number | null): number | null => {
  if (rating === null || !Number.isFinite(rating) || rating <= 0) {
    return null;
  }

  return Math.min(Math.max(Math.round(rating / 2), 1), 5);
};

export { starsOf };
