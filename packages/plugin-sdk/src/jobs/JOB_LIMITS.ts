const JOB_LIMITS = {
  payloadCharacters: 16_000,
  waiting: 500,
  afterSeconds: 7 * 86_400,
  keyCharacters: 100,
} as const;

export { JOB_LIMITS };
