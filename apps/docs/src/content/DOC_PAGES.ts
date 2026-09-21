import frontmatters from 'virtual:doc-frontmatter';
import { buildDocPages } from '@ValenceDocs/content/buildDocPages';
import type { DocModule } from '@ValenceDocs/content/DocPage.types';

const loaders = import.meta.glob<DocModule>('./*/*.mdx');

const DOC_PAGES = buildDocPages(
  Object.entries(loaders).map(([file, load]) => ({
    file,
    frontmatter: frontmatters[file] ?? {},
    load,
  })),
);

export { DOC_PAGES };
