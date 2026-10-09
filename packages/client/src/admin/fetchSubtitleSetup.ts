import { readFromServer } from '@ValenceClient/query/readFromServer';
import { SubtitleSetupSchema } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleSetup } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * Reads where Valence finds subtitles: which sites have a key, the OpenSubtitles account, and the
 * languages wanted.
 *
 * @returns The setup, without the keys themselves.
 */
const fetchSubtitleSetup = (): Promise<SubtitleSetup> =>
  readFromServer('/api/admin/subtitles', SubtitleSetupSchema);

export { fetchSubtitleSetup };
