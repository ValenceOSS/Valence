const ROUTE_LIMITS = {
  requestBytes: 256 * 1024,
  answerCharacters: 8_000_000,
  cacheSeconds: 86_400,
} as const;

export { ROUTE_LIMITS };
