import { z } from 'zod';

const GithubRepositorySchema = z.object({ stargazers_count: z.number().int().nonnegative() });

/**
 * Reads the repository's current star count out of GitHub's own repository object, refusing
 * anything that is not one.
 *
 * @param raw - The repository, exactly as GitHub's API returns it.
 * @returns How many people have starred it.
 */
const readStarCount = (raw: Parameters<typeof GithubRepositorySchema.parse>[0]): number =>
  GithubRepositorySchema.parse(raw).stargazers_count;

export { readStarCount };
