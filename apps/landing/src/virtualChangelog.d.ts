declare module 'virtual:changelog' {
  type GithubReleaseJson = {
    tag_name: string;
    name: string | null;
    body: string | null;
    published_at: string | null;
    html_url: string;
    prerelease: boolean;
    draft: boolean;
  };

  const releases: GithubReleaseJson[];

  export type { GithubReleaseJson };
  export default releases;
}
