import { sendTitleWork } from '@ValenceClient/admin/sendTitleWork';
import type { TitleWorkAnswer } from '@ValenceClient/admin/sendTitleWork';
import type { EpisodePinRequest } from '@ValenceContracts/schemas/EpisodeOrder';

/**
 * Says which episode a file is, whatever its name says, and reads it again as that one: the fix
 * for one episode matched wrong, or a file holding several.
 *
 * @param mediaId - The file.
 * @param pin - Its season, episode and last episode, or nothing to go back to its name's.
 * @returns The job reading it again, or why it was refused.
 */
const pinEpisode = (mediaId: string, pin: EpisodePinRequest['pin']): Promise<TitleWorkAnswer> =>
  sendTitleWork(`/api/media/${mediaId}/episode-pin`, { pin }, 'PUT');

export { pinEpisode };
