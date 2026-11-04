import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describePicture } from '@ValenceClient/library/describePicture';
import { sayCount } from '@ValenceI18n/sayCount';
import type { MediaTitle } from './MediaTitle.types';

/**
 * Says what a row is at a glance, beneath its name: how long and how sharp a film or an episode
 * is, how many seasons and episodes of a series are on the disk, or how many episodes a season has.
 *
 * @param title - The title.
 * @returns The line to show.
 */
const describeTitle = (title: MediaTitle): string => {
  if (title.kind === 'film' && title.parts.length > 0) {
    return sayCount('common.count.editions', title.parts.length);
  }

  if (title.kind === 'episode' && title.parts.length > 0) {
    return `${formatDuration(title.lead.durationSeconds)} · ${sayCount('common.count.editions', title.parts.length)}`;
  }

  if (title.kind === 'season') {
    return sayCount('common.count.episodes', title.episodes.length);
  }

  if (title.kind === 'series') {
    return `${sayCount('common.count.seasons', title.seasons)} · ${sayCount('common.count.episodes', title.episodes.length)}`;
  }

  return [
    formatDuration(title.lead.durationSeconds),
    describePicture(title.lead),
    title.lead.videoCodec.toUpperCase(),
  ]
    .filter((part) => part !== null && part !== '')
    .join(' · ');
};

export { describeTitle };
