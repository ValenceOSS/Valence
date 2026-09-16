declare module 'virtual:github-stars' {
  type GithubRepositoryJson = {
    stargazers_count: number;
  };

  const repository: GithubRepositoryJson;

  export type { GithubRepositoryJson };
  export default repository;
}
