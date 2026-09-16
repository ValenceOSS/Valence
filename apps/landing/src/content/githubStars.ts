import { z } from 'zod';
import type { GithubRepositoryJson } from 'virtual:github-stars';

const githubRepositorySchema = z.object({ stargazers_count: z.number() });

/**
 * Reads the repository's current star count out of GitHub's own repository object.
 *
 * @param raw - The repository, exactly as GitHub's API returns it.
 * @returns How many people have starred it.
 */
const readStarCount = (raw: GithubRepositoryJson): number =>
  githubRepositorySchema.parse(raw).stargazers_count;

export { readStarCount };
