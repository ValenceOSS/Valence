import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';

/**
 * Where one episode, album or film a request waits for stands, as a title page draws it: waiting on
 * approval, not followed, here, on its way, failed, missing, or not out yet.
 *
 * @param item - What the request waits for.
 * @param approval - Whether the request is approved.
 * @returns Where it stands.
 */
const partOfItem = (
  item: Pick<RequestItem, 'state' | 'isFollowed'>,
  approval: MediaRequest['approval'],
): TitlePart => {
  if (item.state === 'available' || item.state === 'filed') {
    return 'library';
  }

  if (approval === 'awaiting') {
    return 'toApprove';
  }

  if (!item.isFollowed) {
    return 'notFollowed';
  }

  switch (item.state) {
    case 'chosen':
    case 'downloading':
    case 'filing':
      return 'downloading';
    case 'failed':
      return 'failed';
    case 'wanted':
    case 'searching':
      return 'missing';
    case 'waiting':
      return 'waiting';
  }
};

export { partOfItem };
