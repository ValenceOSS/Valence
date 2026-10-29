/**
 * The headers every request to GitHub's API is sent with: the version of its JSON to answer in,
 * and the token the site was given, where it was given one, so it is allowed more requests.
 *
 * @returns The headers.
 */
const githubHeaders = (): Record<string, string> => {
  const token = process.env.GITHUB_TOKEN ?? '';

  return {
    Accept: 'application/vnd.github+json',
    ...(token === '' ? {} : { Authorization: `Bearer ${token}` }),
  };
};

export { githubHeaders };
