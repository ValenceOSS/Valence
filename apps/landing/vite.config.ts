import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tsImport } from 'tsx/esm/api';
import { z } from 'zod';
import type { catalogueSignedBy } from '@ValenceSDK/package/catalogueSignedBy';
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

const CATALOGUE_VIRTUAL_ID = 'virtual:plugin-catalogue';

const RESOLVED_CATALOGUE_VIRTUAL_ID = `\0${CATALOGUE_VIRTUAL_ID}`;

const CATALOGUE_URL =
  process.env.VALENCE_PLUGIN_CATALOGUE_URL ??
  'https://valenceoss.github.io/valence-plugins/catalogue.json';

const NO_CATALOGUE = '{"format":1,"generatedAt":"1970-01-01T00:00:00.000Z","plugins":[]}';

let cachedCatalogue: Promise<string> | null = null;

const SigningSchema = z.object({
  catalogueSignedBy: z.custom<typeof catalogueSignedBy>((value) => typeof value === 'function'),
});

const KeysSchema = z.object({ OFFICIAL_PLUGIN_KEYS: z.record(z.string(), z.string()) });

/**
 * Whether the catalogue was signed by one of the Valence project's keys. The check is the SDK's own,
 * the same one a server makes before installing anything from the catalogue, loaded through tsx
 * because Vite does not resolve the workspace's aliases while it is loading its own config.
 *
 * @param bytes - The catalogue, exactly as it was published.
 * @param signatureText - Its signature file.
 * @returns Whether the Valence project signed it.
 */
const isSignedByValence = async (bytes: Uint8Array, signatureText: string): Promise<boolean> => {
  const [signing, keys] = await Promise.all([
    tsImport('@ValenceSDK/package/catalogueSignedBy', import.meta.url),
    tsImport('@ValenceSDK/package/OFFICIAL_PLUGIN_KEYS', import.meta.url),
  ]);

  return (
    SigningSchema.parse(signing).catalogueSignedBy(
      bytes,
      signatureText,
      KeysSchema.parse(keys).OFFICIAL_PLUGIN_KEYS,
    ) !== null
  );
};

/**
 * Fetches the official plugin catalogue once per build or dev-server run, and lists it only once its
 * signature holds against the official keys, as a server would before installing from it. Settles
 * for an empty one where it cannot be had, is not signed or is not JSON, so a catalogue that is down
 * never fails the site's build and one that was tampered with is never shown. Whether it is a
 * catalogue at all is the plugins page's to check, as it reads it.
 *
 * Unlike the GitHub API calls, no token is ever sent: the catalogue is a public page and a
 * credential has no business travelling to it. Nothing is fetched under a test runner.
 *
 * @returns The catalogue as JSON text.
 */
const fetchCatalogue = async (): Promise<string> => {
  if (process.env.VITEST !== undefined) {
    return NO_CATALOGUE;
  }

  cachedCatalogue ??= Promise.all([
    fetch(CATALOGUE_URL, { headers: { Accept: 'application/json' } }),
    fetch(`${CATALOGUE_URL}.sig`),
  ])
    .then(async ([catalogue, signature]) => {
      if (!catalogue.ok || !signature.ok) {
        process.stderr.write(`Could not read ${CATALOGUE_URL}. Carrying on without it.\n`);

        return NO_CATALOGUE;
      }

      const bytes = new Uint8Array(await catalogue.arrayBuffer());

      if (!(await isSignedByValence(bytes, await signature.text()))) {
        process.stderr.write(
          `${CATALOGUE_URL} is not signed by the Valence project. Listing no plugins.\n`,
        );

        return NO_CATALOGUE;
      }

      const text = new TextDecoder().decode(bytes);

      JSON.parse(text);

      return text;
    })
    .catch(() => {
      process.stderr.write(`Could not read ${CATALOGUE_URL}. Carrying on without it.\n`);

      return NO_CATALOGUE;
    });

  return cachedCatalogue;
};

/**
 * Hands the app the official plugin catalogue as a module, fetched at build or dev-server start, so
 * the plugins page ships with its listing already in it.
 */
const pluginCatalogueContent = (): Plugin => ({
  name: 'valence-plugin-catalogue-content',

  resolveId: (id) => (id === CATALOGUE_VIRTUAL_ID ? RESOLVED_CATALOGUE_VIRTUAL_ID : undefined),

  load: async (id) => {
    if (id !== RESOLVED_CATALOGUE_VIRTUAL_ID) {
      return undefined;
    }

    const raw = await fetchCatalogue();

    return `export default ${raw};`;
  },
});

const UI_CATALOGUE_VIRTUAL_ID = 'virtual:ui-catalogue';

const RESOLVED_UI_CATALOGUE_VIRTUAL_ID = `\0${UI_CATALOGUE_VIRTUAL_ID}`;

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const UI_COMPONENTS = fileURLToPath(new URL('../../packages/ui/src/components', import.meta.url));

const UiPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  values: z.array(z.string()),
  isRequired: z.boolean(),
  defaultValue: z.string().nullable(),
  description: z.string().nullable(),
});

const UiCatalogueSchema = z.array(
  z.object({
    name: z.string(),
    summary: z.string(),
    props: z.array(UiPropSchema),
    inherits: z.array(z.string()),
    builtOn: z.array(z.object({ name: z.string(), url: z.string().url() })),
  }),
);

const UiCatalogueToolSchema = z.object({
  buildUiCatalogue: z.custom<(root: string) => z.input<typeof UiCatalogueSchema>>(
    (value) => typeof value === 'function',
  ),
});

/**
 * Hands the UI library page what every ValenceUI component documents about itself — summary, props,
 * types, defaults — read straight from the components' source each time the site is built or the
 * dev server asks, so the page can never list a prop that no longer exists or miss one that does.
 * It watches the components folder, so editing a component's props shows up without a restart.
 */
const uiCatalogueContent = (): Plugin => ({
  name: 'valence-ui-catalogue-content',

  resolveId: (id) =>
    id === UI_CATALOGUE_VIRTUAL_ID ? RESOLVED_UI_CATALOGUE_VIRTUAL_ID : undefined,

  load: async function load(id) {
    if (id !== RESOLVED_UI_CATALOGUE_VIRTUAL_ID) {
      return undefined;
    }

    for (const entry of readdirSync(UI_COMPONENTS, { recursive: true, encoding: 'utf8' })) {
      if (entry.endsWith('.tsx') || entry.endsWith('.types.ts')) {
        this.addWatchFile(`${UI_COMPONENTS}/${entry}`);
      }
    }

    const tool = UiCatalogueToolSchema.parse(
      await tsImport('../../tools/uiCatalogue/buildUiCatalogue.ts', import.meta.url),
    );

    return `export default ${JSON.stringify(UiCatalogueSchema.parse(tool.buildUiCatalogue(REPOSITORY_ROOT)))};`;
  },
});

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    react(),
    tailwindcss(),
    changelogContent(),
    githubStarsContent(),
    pluginCatalogueContent(),
    uiCatalogueContent(),
  ],
  server: {
    port: 5174,
    host: true,
  },
});

export { changelogContent, githubStarsContent, pluginCatalogueContent, uiCatalogueContent };
