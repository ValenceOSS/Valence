import type { EngineFault } from '@ValenceContracts/schemas/EngineFault';

const LONGEST_DETAIL = 300;

const ADDRESS = /(https?:\/\/[^\s/?#]+)[^\s]*/g;

/**
 * What the engine says about a failure, for the server's log: where it failed and what the failure
 * said, with every address cut to its origin, since a linked server's ticket travels in the path.
 *
 * @param stage - Where the engine was when it failed.
 * @param failure - What failed, where there is something that says.
 * @returns The fault, its detail no longer than a log line carries.
 */
const faultOf = (stage: EngineFault['stage'], failure: { message: string } | null): EngineFault => {
  const said = failure?.message.replace(ADDRESS, '$1').trim() ?? '';

  return { stage, detail: said === '' ? null : said.slice(0, LONGEST_DETAIL) };
};

export { faultOf };
