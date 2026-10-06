const PAUSABLE_STATES: ReadonlySet<string> = new Set([
  'queued',
  'metadata',
  'downloading',
  'stalled',
]);

export { PAUSABLE_STATES };
