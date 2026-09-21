import { DOC_PAGES } from '@ValenceDocs/content/DOC_PAGES';

const loadSources = () => import('virtual:doc-sources').then((loaded) => loaded.default);

const DOC_SOURCES = Object.fromEntries(
  DOC_PAGES.map((page) => {
    const key = `.${page.path}.mdx`;

    return [key, async () => (await loadSources())[key] ?? ''] as const;
  }),
);

export { DOC_SOURCES };
