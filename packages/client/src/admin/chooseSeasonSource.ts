import { sendTitleWork } from '@ValenceClient/admin/sendTitleWork';
import type { TitleWorkAnswer } from '@ValenceClient/admin/sendTitleWork';
import type { ChooseSeasonSource } from '@ValenceContracts/schemas/SeasonSource';

/**
 * Says a season is another catalogue entry's season, such as a revival the catalogue keeps as a
 * show of its own, and reads its episodes again from there; or with nothing, from the show's own.
 *
 * @param mediaId - Any episode of the season.
 * @param source - The entry and its season, or nothing for the show's own.
 * @returns The job reading the season again, or why it was refused.
 */
const chooseSeasonSource = (
  mediaId: string,
  source: ChooseSeasonSource['source'],
): Promise<TitleWorkAnswer> =>
  sendTitleWork(`/api/media/${mediaId}/season-source`, { source }, 'PUT');

export { chooseSeasonSource };
