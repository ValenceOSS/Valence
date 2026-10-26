type TroubleReason =
  | 'rateLimited'
  | 'keyMissing'
  | 'keyRefused'
  | 'refused'
  | 'faulty'
  | 'unreachable';

type SourceTrouble = { source: string; reason: TroubleReason };

export type { SourceTrouble, TroubleReason };
