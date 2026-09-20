import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

const CHANGELOG_VIRTUAL_ID = 'virtual:changelog';

const RESOLVED_CHANGELOG_VIRTUAL_ID = `\0${CHANGELOG_VIRTUAL_ID}`;

const REPOSITORY = 'ValenceOSS/Valence';

const RELEASES_URL = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=100`;

const NO_RELEASES = '[]';

const NO_STARS = '{"stargazers_count":0}';

/**
 * Asks GitHub for something once, and settles for a stand-in where it cannot have it.
 *
 * Never throws. An unauthenticated caller gets sixty requests an hour per address, and a CI runner
 * shares its address with every other job on the machine — so this comes back 403 often enough
 * that treating it as fatal made the landing tests fail at random, because the config is loaded to
 * run them and a plugin that throws takes every suite importing it down with it.
 *
 * A token lifts the limit where one is going, which is what makes a real build reliable rather
 * than merely survivable.
 *
 * Nothing is fetched under a test runner at all. A test that reaches the network is a test that
 * can fail for reasons that have nothing to do with the code.
 *
 * @param url - What to ask for.
 * @param insteadOf - What to answer with where it cannot be had, as JSON.
 * @returns The response body, or the stand-in.
 */
const fetchFromGitHub = async (url: string, insteadOf: string): Promise<string> => {
  if (process.env.VITEST !== undefined) {
    return insteadOf;
  }

  const token = process.env.GITHUB_TOKEN ?? '';

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token === '' ? {} : { Authorization: `Bearer ${token}` }),
    },
  }).catch(() => null);

  if (response === null || !response.ok) {
    process.stderr.write(
      `Could not read ${url} from GitHub${response === null ? '' : `: ${response.status.toString()}`}. Carrying on without it.\n`,
    );

    return insteadOf;
  }

  return response.text();
};

let cachedReleases: Promise<string> | null = null;

/**
 * Fetches every release GitHub has recorded for the repository, once per build or dev-server run,
 * so a Vite restart during local development doesn't refetch on every file the plugin is asked
 * about.
 *
 * @returns The releases, exactly as GitHub's API returns them.
 */
const fetchReleases = async (): Promise<string> => {
  cachedReleases ??= fetchFromGitHub(RELEASES_URL, NO_RELEASES);

  return cachedReleases;
};

/**
 * Hands the app the repository's own GitHub releases as a module, fetched once at build or
 * dev-server start, so the changelog page shows the same releases GitHub's UI does rather than a
 * hand-kept copy of them.
 *
 * A virtual module rather than a client-side fetch, so the page ships with its content already in
 * it and never shows a loading state or spends a visitor's own rate limit.
 */
const changelogContent = (): Plugin => ({
  name: 'valence-changelog-content',

  resolveId: (id) => (id === CHANGELOG_VIRTUAL_ID ? RESOLVED_CHANGELOG_VIRTUAL_ID : undefined),

  load: async (id) => {
    if (id !== RESOLVED_CHANGELOG_VIRTUAL_ID) {
      return undefined;
    }

    const raw = await fetchReleases();

    return `export default ${raw};`;
  },
});

const STARS_VIRTUAL_ID = 'virtual:github-stars';

const RESOLVED_STARS_VIRTUAL_ID = `\0${STARS_VIRTUAL_ID}`;

const REPOSITORY_URL = `https://api.github.com/repos/${REPOSITORY}`;

let cachedRepository: Promise<string> | null = null;

/**
 * Fetches the repository itself from GitHub, once per build or dev-server run.
 *
 * @returns The repository, exactly as GitHub's API returns it.
 */
const fetchRepository = async (): Promise<string> => {
  cachedRepository ??= fetchFromGitHub(REPOSITORY_URL, NO_STARS);

  return cachedRepository;
};

/**
 * Hands the app the repository's own GitHub record as a module, fetched once at build or
 * dev-server start, so the nav's star badge shows a real count without a visitor's own request or
 * a loading state.
 */
const githubStarsContent = (): Plugin => ({
  name: 'valence-github-stars-content',

  resolveId: (id) => (id === STARS_VIRTUAL_ID ? RESOLVED_STARS_VIRTUAL_ID : undefined),

  load: async (id) => {
    if (id !== RESOLVED_STARS_VIRTUAL_ID) {
      return undefined;
    }

    const raw = await fetchRepository();

    return `export default ${raw};`;
  },
});

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss(), changelogContent(), githubStarsContent()],
  server: {
    port: 5174,
    host: true,
  },
});

export { changelogContent, githubStarsContent };
