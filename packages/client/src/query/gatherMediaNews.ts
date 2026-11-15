import { MediaNewsSchema } from '@ValenceClient/query/MediaNewsSchema';
import type { RealtimeEvent } from '@ValenceContracts/schemas/Realtime';

type MediaNews = {
  isEverything: boolean;
  artwork: ReadonlySet<string>;
  changed: ReadonlySet<string>;
  isCollections: boolean;
  isLikeness: boolean;
};

const NOTHING_YET: MediaNews = {
  isEverything: false,
  artwork: new Set(),
  changed: new Set(),
  isCollections: false,
  isLikeness: false,
};

/**
 * Adds what one media event says changed to what the events before it said, falling back to
 * everything where the event names nothing or stands for several the server folded together.
 *
 * @param was - What the events gathered so far said, or null where this is the first.
 * @param event - The event.
 * @returns What all of them say changed.
 */
const gatherMediaNews = (was: MediaNews | null, event: RealtimeEvent): MediaNews => {
  const gathered = was ?? NOTHING_YET;
  const read = event.folded === 0 ? MediaNewsSchema.safeParse(event.payload) : null;
  const news = read?.success === true ? read.data : null;

  if (gathered.isEverything || news === null) {
    return { ...gathered, isEverything: true };
  }

  switch (news.event) {
    case 'artwork':
      return { ...gathered, artwork: new Set([...gathered.artwork, ...news.mediaIds]) };
    case 'metadata':
      return { ...gathered, changed: new Set([...gathered.changed, ...news.mediaIds]) };
    case 'changed':
      return {
        ...gathered,
        changed: new Set([
          ...gathered.changed,
          ...('mediaIds' in news ? news.mediaIds : [news.mediaId]),
        ]),
      };
    case 'collections':
      return { ...gathered, isCollections: true };
    case 'likeness':
      return { ...gathered, isLikeness: true };
  }
};

export type { MediaNews };

export { gatherMediaNews };
