import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { searchDocs } from '@ValenceDocs/content/searchDocs';
import { toSearchText } from '@ValenceDocs/content/toSearchText';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';
import type { SearchEntry } from '@ValenceDocs/content/searchDocs';

type DocsSearchProps = {
  pages: readonly DocPage[];
  sources: Readonly<Record<string, () => Promise<string>>>;
};

/**
 * Searches every page as somebody types, reading the pages the first time the field is used.
 *
 * Nothing is fetched until then, because most visitors never search and the text of every page is
 * the largest thing on the site.
 *
 * @param pages - Every page.
 * @param sources - How to read each page's source, keyed by its file path.
 */
const DocsSearch = ({ pages, sources }: DocsSearchProps) => {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<readonly SearchEntry[] | null>(null);

  const load = () => {
    if (entries !== null) {
      return;
    }

    setEntries([]);

    void Promise.all(
      pages.map(async (page): Promise<SearchEntry> => {
        const read = sources[`.${page.path}.mdx`];

        return {
          path: page.path,
          title: page.title,
          sectionTitle: page.sectionTitle,
          text: read === undefined ? page.description : toSearchText(await read()),
        };
      }),
    ).then(setEntries);
  };

  const results = searchDocs(entries ?? [], query);

  return (
    <div className="relative w-full max-w-md" onFocus={load}>
      <TextField
        label="Search the documentation"
        isLabelHidden
        type="search"
        size="sm"
        isPill
        placeholder="Search the docs"
        value={query}
        onValueChange={setQuery}
        icon={<Icon of={SearchIcon} size={16} tone="muted" />}
      />

      {query.trim() === '' ? null : (
        <div
          role="region"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-overlay)]"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-text-muted">
              {entries === null || entries.length === 0
                ? 'Reading the pages...'
                : 'Nothing matches that.'}
            </p>
          ) : (
            results.map((result) => (
              <Link
                key={result.path}
                to={result.path}
                onClick={() => {
                  setQuery('');
                }}
                className="flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-surface-raised"
              >
                <span className="text-sm font-medium text-text">
                  {result.title}
                  <span className="ml-2 text-xs font-normal text-text-muted">
                    {result.sectionTitle}
                  </span>
                </span>
                <span className="line-clamp-2 text-xs text-text-muted">{result.snippet}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

DocsSearch.displayName = 'DocsSearch';

export type { DocsSearchProps };

export { DocsSearch };
