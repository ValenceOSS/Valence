import { sendTitleWork } from '@ValenceClient/admin/sendTitleWork';
import type { TitleWorkAnswer } from '@ValenceClient/admin/sendTitleWork';
import type { ExtraChoiceRequest } from '@ValenceContracts/schemas/ExtraChoice';

/**
 * Says a file is an extra of a title, such as its trailer, or that it is not an extra at all,
 * whatever its name and folder say, and reads it again as that.
 *
 * @param mediaId - The file.
 * @param choice - What kind of extra it is and which title's, or nothing for not an extra.
 * @returns The job reading it again, or why it was refused.
 */
const chooseExtra = (mediaId: string, choice: ExtraChoiceRequest): Promise<TitleWorkAnswer> =>
  sendTitleWork(`/api/media/${mediaId}/extra`, choice, 'PUT');

export { chooseExtra };
