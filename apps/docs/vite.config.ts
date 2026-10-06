import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { parse } from 'yaml';
import { DocFrontmatterSchema } from './src/content/DocFrontmatterSchema.ts';
import type { DocFrontmatter } from './src/content/DocFrontmatterSchema.ts';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import bash from 'highlight.js/lib/languages/bash';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import dos from 'highlight.js/lib/languages/dos';
import http from 'highlight.js/lib/languages/http';
import ini from 'highlight.js/lib/languages/ini';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import powershell from 'highlight.js/lib/languages/powershell';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';

/**
 * Compiles the pages under `src/content` from MDX, with tables, heading anchors, highlighted code
 * and each page's frontmatter exported beside it.
 *
 * Runs ahead of the React plugin because that is the plugin that turns the JSX it produces into
 * something the browser can run.
 */
const documentation = () => ({
  enforce: 'pre' as const,
  ...mdx({
    remarkPlugins: [remarkGfm, remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeHighlight,
        {
          languages: {
            bash,
            dockerfile,
            dos,
            http,
            ini,
            json,
            nginx,
            powershell,
            typescript,
            yaml,
          },
          aliases: { bash: ['sh'], ini: ['env'], dos: ['bat'], typescript: ['ts', 'tsx'] },
          detect: false,
        },
      ],
    ],
  }),
});

const FRONTMATTER_VIRTUAL_ID = 'virtual:doc-frontmatter';

const RESOLVED_FRONTMATTER_VIRTUAL_ID = `\0${FRONTMATTER_VIRTUAL_ID}`;

const CONTENT_FOLDER = join(import.meta.dirname, 'src', 'content');

const SOURCES_VIRTUAL_ID = 'virtual:doc-sources';

const RESOLVED_SOURCES_VIRTUAL_ID = `\0${SOURCES_VIRTUAL_ID}`;

const FRONTMATTER_BLOCK = /^---\n(?<yaml>[\s\S]*?)\n---/u;

/**
 * Reads the frontmatter of every page into one module, without loading the pages themselves.
 *
 * Importing a page's frontmatter from the page pulls the whole page into whichever chunk asks, which
 * put every page in the first download. The sidebar needs only titles, so they are read from the
 * files here and the pages stay behind their own imports.
 */
const docFrontmatter = (): Plugin => ({
  name: 'valence-doc-frontmatter',

  resolveId: (id) => (id === FRONTMATTER_VIRTUAL_ID ? RESOLVED_FRONTMATTER_VIRTUAL_ID : undefined),

  load: async (id) => {
    if (id !== RESOLVED_FRONTMATTER_VIRTUAL_ID) {
      return undefined;
    }

    const found: Record<string, Partial<DocFrontmatter>> = {};

    for (const section of await readdir(CONTENT_FOLDER, { withFileTypes: true })) {
      if (!section.isDirectory()) {
        continue;
      }

      for (const file of await readdir(join(CONTENT_FOLDER, section.name))) {
        if (file.endsWith('.mdx')) {
          const source = await readFile(join(CONTENT_FOLDER, section.name, file), 'utf8');
          const yaml = FRONTMATTER_BLOCK.exec(source)?.groups?.yaml;

          found[`./${section.name}/${file}`] =
            yaml === undefined ? {} : DocFrontmatterSchema.partial().parse(parse(yaml));
        }
      }
    }

    return `export default ${JSON.stringify(found)};`;
  },
});

/**
 * Reads the text of every page into one module, for search to load the first time it is used.
 *
 * The pages cannot be imported as raw text, since the MDX plugin compiles a page whatever it is
 * asked for, so their source is read from the files here and kept out of the first download.
 */
const docSources = (): Plugin => ({
  name: 'valence-doc-sources',

  resolveId: (id) => (id === SOURCES_VIRTUAL_ID ? RESOLVED_SOURCES_VIRTUAL_ID : undefined),

  load: async (id) => {
    if (id !== RESOLVED_SOURCES_VIRTUAL_ID) {
      return undefined;
    }

    const found: Record<string, string> = {};

    for (const section of await readdir(CONTENT_FOLDER, { withFileTypes: true })) {
      if (section.isDirectory()) {
        for (const file of await readdir(join(CONTENT_FOLDER, section.name))) {
          if (file.endsWith('.mdx')) {
            found[`./${section.name}/${file}`] = await readFile(
              join(CONTENT_FOLDER, section.name, file),
              'utf8',
            );
          }
        }
      }
    }

    return `export default ${JSON.stringify(found)};`;
  },
});

/**
 * Reads the pages again when one is added, taken away or changed while the dev server runs.
 *
 * The frontmatter and the sources are virtual modules built from the folder once, so without this a
 * page written after the server started has no frontmatter in them, and the site refuses to draw at
 * all until it is restarted. A page added or taken away reloads the site, since the sidebar changes;
 * a page changed only has the two modules read afresh next time they are asked for.
 */
const docPagesFollowed = (): Plugin => ({
  name: 'valence-doc-pages-followed',

  configureServer: (server) => {
    const forget = (path: string): boolean => {
      if (!path.startsWith(CONTENT_FOLDER) || !path.endsWith('.mdx')) {
        return false;
      }

      const graph = server.environments.client.moduleGraph;

      for (const id of [RESOLVED_FRONTMATTER_VIRTUAL_ID, RESOLVED_SOURCES_VIRTUAL_ID]) {
        const held = graph.getModuleById(id);

        if (held !== undefined) {
          graph.invalidateModule(held);
        }
      }

      return true;
    };

    const reload = (path: string) => {
      if (forget(path)) {
        server.ws.send({ type: 'full-reload' });
      }
    };

    server.watcher.on('add', reload);
    server.watcher.on('unlink', reload);
    server.watcher.on('change', forget);
  },
});

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    documentation(),
    docFrontmatter(),
    docSources(),
    docPagesFollowed(),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5175,
    host: true,
  },
});

export { docFrontmatter, docSources, documentation };
