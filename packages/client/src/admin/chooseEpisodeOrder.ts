import { sendTitleWork } from '@ValenceClient/admin/sendTitleWork';
import type { TitleWorkAnswer } from '@ValenceClient/admin/sendTitleWork';

/**
 * Chooses which of the catalogue's orders a programme's episodes are numbered in, such as its DVD
 * order, and reads every episode again by it.
 *
 * @param mediaId - Any file of the programme.
 * @param order - The order, or nothing for the catalogue's own.
 * @returns The job reading them again, or why it was refused.
 */
const chooseEpisodeOrder = (mediaId: string, order: string | null): Promise<TitleWorkAnswer> =>
  sendTitleWork(`/api/media/${mediaId}/episode-order`, { order }, 'PUT');

export { chooseEpisodeOrder };
