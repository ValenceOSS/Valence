type Scan =
  { kind: 'read'; text: string } | { kind: 'closed' } | { kind: 'refused' } | { kind: 'unable' };

export type { Scan };
