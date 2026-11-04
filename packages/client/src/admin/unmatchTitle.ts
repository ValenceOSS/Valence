import { sendTitleWork } from '@ValenceClient/admin/sendTitleWork';
import type { TitleWorkAnswer } from '@ValenceClient/admin/sendTitleWork';

/**
 * Takes a title back to what its file names say, and keeps it unmatched until it is matched by hand.
 *
 * @param mediaId - A file of the title.
 * @returns How many files it reached and the job reading them again, or why it was refused.
 */
const unmatchTitle = (mediaId: string): Promise<TitleWorkAnswer> =>
  sendTitleWork(`/api/media/${mediaId}/unmatch`);

export { unmatchTitle };
