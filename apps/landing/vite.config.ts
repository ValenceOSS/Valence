import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

const CHANGELOG_VIRTUAL_ID = 'virtual:changelog';

const RESOLVED_CHANGELOG_VIRTUAL_ID = `\0${CHANGELOG_VIRTUAL_ID}`;

const RELEASES_URL = 'https://api.github.com/repos/MarquesCoding/Valence/releases?per_page=100';

let cachedReleases: Promise<string> | null = null;

/**
 * Fetches every release GitHub has recorded for the repository, once per build or dev-server run,
 * so a Vite restart during local development doesn't refetch on every file the plugin is asked
 * about.
 *
 * @returns The releases, exactly as GitHub's API returns them.
 */
const fetchReleases = async (): Promise<string> => {
  cachedReleases ??= (async () => {
    const response = await fetch(RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch releases from GitHub: ${response.status.toString()}`);
    }

    return response.text();
  })();

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

const REPOSITORY_URL = 'https://api.github.com/repos/MarquesCoding/Valence';

let cachedRepository: Promise<string> | null = null;

/**
 * Fetches the repository itself from GitHub, once per build or dev-server run.
 *
 * @returns The repository, exactly as GitHub's API returns it.
 */
const fetchRepository = async (): Promise<string> => {
  cachedRepository ??= (async () => {
    const response = await fetch(REPOSITORY_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the repository from GitHub: ${response.status.toString()}`);
    }

    return response.text();
  })();

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
