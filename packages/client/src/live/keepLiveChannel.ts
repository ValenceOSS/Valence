import { profileHeaders } from '@ValenceClient/profiles/currentProfile';

/**
 * Keeps a channel as one of this viewer's favourites, or stops.
 *
 * @param id - The channel.
 * @param isKept - Whether it should be kept.
 * @returns Whether the server agreed.
 */
const keepLiveChannel = async (id: string, isKept: boolean): Promise<boolean> => {
  const response = await fetch(`/api/live/channels/${encodeURIComponent(id)}/favourite`, {
    method: isKept ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
    headers: profileHeaders(),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { keepLiveChannel };
