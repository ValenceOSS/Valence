import type { LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

/**
 * What a channel is showing now and what follows it, from the guide.
 *
 * @param programmes - Every programme in the guide.
 * @param channelId - The channel.
 * @param now - The time now, in milliseconds.
 * @returns The programme on now and the one after, each or nothing, and every programme the
 *   channel has in the guide.
 */
const onNowAndNext = (
  programmes: readonly LiveProgramme[],
  channelId: string | null,
  now: number,
): { onNow: LiveProgramme | null; upNext: LiveProgramme | null; all: LiveProgramme[] } => {
  const all =
    channelId === null ? [] : programmes.filter((programme) => programme.channelId === channelId);

  return {
    onNow:
      all.find(
        (programme) => Date.parse(programme.startsAt) <= now && now < Date.parse(programme.endsAt),
      ) ?? null,
    upNext: all.find((programme) => Date.parse(programme.startsAt) > now) ?? null,
    all,
  };
};

export { onNowAndNext };
