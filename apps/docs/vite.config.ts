import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { parse } from 'yaml';
import {
  llmsFullTxtOf,
  llmsTxtOf,
  markdownOf,
  markdownPathOf,
} from './src/content/aiReadableDocs.ts';
import type { AiReadablePage } from './src/content/aiReadableDocs.ts';
import { DOC_SECTIONS } from './src/content/DOC_SECTIONS.ts';
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

const AI_READABLE_CONTENT_TYPE = 'text/markdown; charset=utf-8';

const CONTENT_FILE_PATH = /^\.\/(?<section>[a-z0-9-]+)\/(?<slug>[a-z0-9-]+)\.mdx$/u;

type DocSourceFile = {
  file: string;
  frontmatter: Partial<DocFrontmatter>;
  source: string;
};

const readDocSourceFiles = async (): Promise<readonly DocSourceFile[]> => {
  const found: DocSourceFile[] = [];

  for (const section of await readdir(CONTENT_FOLDER, { withFileTypes: true })) {
    if (!section.isDirectory()) {
      continue;
    }

    for (const file of await readdir(join(CONTENT_FOLDER, section.name))) {
      if (!file.endsWith('.mdx')) {
        continue;
      }

      const source = await readFile(join(CONTENT_FOLDER, section.name, file), 'utf8');
      const yaml = FRONTMATTER_BLOCK.exec(source)?.groups?.yaml;

      found.push({
        file: `./${section.name}/${file}`,
        frontmatter: yaml === undefined ? {} : DocFrontmatterSchema.partial().parse(parse(yaml)),
        source,
      });
    }
  }

  return found;
};

const readAiReadablePages = async (): Promise<readonly AiReadablePage[]> => {
  const files = await readDocSourceFiles();

  return files
    .map((file): AiReadablePage & { order: number; section: string } => {
      const { section, slug } = CONTENT_FILE_PATH.exec(file.file)?.groups ?? {};
      const known = DOC_SECTIONS.find((candidate) => candidate.id === section);

      if (section === undefined || slug === undefined || known === undefined) {
        throw new Error(
          `${file.file} is not in a section. Put it in one of: ${DOC_SECTIONS.map((s) => s.id).join(', ')}.`,
        );
      }

      const parsed = DocFrontmatterSchema.safeParse(file.frontmatter);

      if (!parsed.success) {
        throw new Error(`${file.file} has incomplete frontmatter: ${parsed.error.message}`);
      }

      return {
        path: `/${section}/${slug}`,
        section,
        sectionTitle: known.title,
        title: parsed.data.title,
        description: parsed.data.description,
        order: parsed.data.order,
        source: file.source,
      };
    })
    .toSorted(
      (a, b) =>
        DOC_SECTIONS.findIndex((section) => section.id === a.section) -
          DOC_SECTIONS.findIndex((section) => section.id === b.section) ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    )
    .map(({ path, sectionTitle, title, description, source }) => ({
      path,
      sectionTitle,
      title,
      description,
      source,
    }));
};

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
 * Emits the documentation in plain Markdown forms for agents and crawlers.
 *
 * Each rendered docs page gets a same-path `.md` twin, `/llms.txt` points readers at those page
 * files, and `/llms-full.txt` carries everything in one fetch for tools that prefer a single file.
 */
const aiReadableDocs = (): Plugin => ({
  name: 'valence-ai-readable-docs',

  configureServer: (server) => {
    server.middlewares.use(async (request, response, next) => {
      if (request.url === undefined) {
        next();
        return;
      }

      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);

      if (pathname !== '/llms.txt' && pathname !== '/llms-full.txt' && !pathname.endsWith('.md')) {
        next();
        return;
      }

      const pages = await readAiReadablePages();
      const page = pages.find((candidate) => markdownPathOf(candidate) === pathname);
      const source =
        pathname === '/llms.txt'
          ? llmsTxtOf(pages)
          : pathname === '/llms-full.txt'
            ? llmsFullTxtOf(pages)
            : page === undefined
              ? null
              : markdownOf(page);

      if (source === null) {
        next();
        return;
      }

      response.statusCode = 200;
      response.setHeader('Content-Type', AI_READABLE_CONTENT_TYPE);
      response.setHeader('Link', '</llms.txt>; rel="describedby"; type="text/markdown"');
      response.end(source);
    });
  },

  generateBundle: async function () {
    const pages = await readAiReadablePages();

    this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxtOf(pages) });
    this.emitFile({ type: 'asset', fileName: 'llms-full.txt', source: llmsFullTxtOf(pages) });

    for (const page of pages) {
      this.emitFile({
        type: 'asset',
        fileName: markdownPathOf(page).slice(1),
        source: markdownOf(page),
      });
    }
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
    aiReadableDocs(),
    docPagesFollowed(),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5175,
    host: true,
  },
});

export { aiReadableDocs, docFrontmatter, docSources, documentation };
