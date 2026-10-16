import { KBPS_IN_A_MBPS } from '@ValenceCore/tokens/KBPS_IN_A_MBPS';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { say } from '@ValenceI18n/say';

/**
 * Says in one line what an account is limited to while it streams: how many of its streams are
 * running out of how many it may have, and the bitrate it is held to.
 *
 * @param streams - The account's limit and how many streams it has running.
 * @returns The line, or null where the account is not limited at all.
 */
const describeStreamLimit = (
  streams: { limit: StreamLimit; now: number } | null,
): string | null => {
  if (streams === null) {
    return null;
  }

  const { limit, now } = streams;
  const said = [
    ...(limit.maxStreams === null
      ? []
      : [
          say('client.admin.describeStreamLimit.streamsOfMost', {
            now: now.toString(),
            most: limit.maxStreams.toString(),
          }),
        ]),
    ...(limit.maxBitrateKbps === null
      ? []
      : [
          say('client.admin.describeStreamLimit.upToMbps', {
            mbps: (limit.maxBitrateKbps / KBPS_IN_A_MBPS).toString(),
          }),
        ]),
  ];

  return said.length === 0 ? null : said.join(' · ');
};

export { describeStreamLimit };
