type ToneMappingCheck =
  | { outcome: 'trusted' }
  | { outcome: 'noWebGpu' }
  | { outcome: 'notDecodable' }
  | { outcome: 'notDecoded' }
  | { outcome: 'changed'; grey: number }
  | { outcome: 'failed'; reason: string };

export type { ToneMappingCheck };
