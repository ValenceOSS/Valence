import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type NowAndNextProps = {
  channel: LiveChannel;
  onNow: LiveProgramme | null;
  upNext: LiveProgramme | null;
  now: number;
  problem: string | null;
};

export type { NowAndNextProps };
