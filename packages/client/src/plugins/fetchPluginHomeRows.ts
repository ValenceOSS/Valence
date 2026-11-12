import { artworkAddresses } from '@ValenceClient/library/artworkAddresses';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PluginHomeRowsSchema } from '@ValenceContracts/schemas/Plugin';
import type { PluginHomeRows } from '@ValenceContracts/schemas/Plugin';

/**
 * The rows plugins add to this profile's home page, from what each plugin last said.
 *
 * @returns The rows.
 */
const fetchPluginHomeRows = async (): Promise<PluginHomeRows> => {
  const answer = await readFromServer('/api/plugins/home-rows', PluginHomeRowsSchema);

  artworkAddresses.learn(answer.rows.flatMap((row) => row.items));

  return answer;
};

export { fetchPluginHomeRows };
