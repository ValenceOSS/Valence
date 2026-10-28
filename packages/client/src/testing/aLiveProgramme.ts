import type { LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

/**
 * A programme in the live TV guide for a test, running between two times.
 *
 * @param channelId - The channel it is on.
 * @param title - What it is called.
 * @param startsAt - When it starts, in milliseconds.
 * @param endsAt - When it ends, in milliseconds.
 * @returns The programme.
 */
const aLiveProgramme = (
  channelId: string,
  title: string,
  startsAt: number,
  endsAt: number,
): LiveProgramme => ({
  channelId,
  startsAt: new Date(startsAt).toISOString(),
  endsAt: new Date(endsAt).toISOString(),
  title,
  subtitle: null,
  description: null,
  category: null,
});

export { aLiveProgramme };
