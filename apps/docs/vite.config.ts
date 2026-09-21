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
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import http from 'highlight.js/lib/languages/http';
import nginx from 'highlight.js/lib/languages/nginx';

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
      [rehypeHighlight, { languages: { dockerfile, http, nginx }, detect: false }],
    ],
  }),
});

const FRONTMATTER_VIRTUAL_ID = 'virtual:doc-frontmatter';

const RESOLVED_FRONTMATTER_VIRTUAL_ID = `\0${FRONTMATTER_VIRTUAL_ID}`;

const CONTENT_FOLDER = join(import.meta.dirname, 'src', 'content');

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

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [documentation(), docFrontmatter(), react(), tailwindcss()],
  server: {
    port: 5175,
    host: true,
  },
});

export { docFrontmatter, documentation };
