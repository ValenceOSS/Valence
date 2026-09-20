type IndexerStart =
  | { kind: 'torznab' }
  | { kind: 'newznab' }
  | { kind: 'cardigann'; definitionId: string; name: string };

export type { IndexerStart };
