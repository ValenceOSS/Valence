import { STREAMING_SERVICES } from '@ValenceCore/releases/STREAMING_SERVICES';

/**
 * Which streaming service a web release was taken from, where its name says — AMZN for Amazon, NF
 * for Netflix, DSNP for Disney+ and so on — written in capitals, as release names write them.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The service's short name, or null where it does not say.
 */
const readService = (spaced: string): string | null =>
  STREAMING_SERVICES.exec(spaced)?.[1]?.toUpperCase() ?? null;

export { readService };
