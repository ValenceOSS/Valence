import { NO_STREAM_LIMIT } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';

/**
 * The limit an account streams under, from its own and those of every role it holds: the lowest
 * ceiling set on each side, since a limit somebody set is one they meant to hold.
 *
 * @param limits - The account's own limit and its roles', any of which may leave a side open.
 * @returns The strictest of them on each side.
 */
const strictestStreamLimit = (limits: readonly StreamLimit[]): StreamLimit =>
  limits.reduce<StreamLimit>(
    (strictest, limit) => ({
      maxBitrateKbps:
        limit.maxBitrateKbps === null
          ? strictest.maxBitrateKbps
          : Math.min(limit.maxBitrateKbps, strictest.maxBitrateKbps ?? Infinity),
      maxStreams:
        limit.maxStreams === null
          ? strictest.maxStreams
          : Math.min(limit.maxStreams, strictest.maxStreams ?? Infinity),
    }),
    NO_STREAM_LIMIT,
  );

export { strictestStreamLimit };
