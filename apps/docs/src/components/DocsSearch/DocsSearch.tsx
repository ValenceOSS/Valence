import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { CommandPalette } from '@ValenceUI/CommandPalette';
import { Icon } from '@ValenceUI/Icon';
import { groupResults } from '@ValenceDocs/components/DocsSearch/groupResults';
import { searchDocs } from '@ValenceDocs/content/searchDocs';
import { toSearchText } from '@ValenceDocs/content/toSearchText';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';
import type { SearchEntry } from '@ValenceDocs/content/searchDocs';

type DocsSearchProps = {
  pages: readonly DocPage[];
  sources: Readonly<Record<string, () => Promise<string>>>;
};

/**
 * The search button in the top bar, and the palette it opens over the page.
 *
 * Opens from the button, from Ctrl or Command with K, and from the slash key where nothing is being
 * typed into. With nothing typed it lists every page as the sidebar does; typing searches the text of
 * every page, which is read the first time the palette opens, because most visitors never search and
 * the text of every page is the largest thing on the site.
 *
 * @param pages - Every page.
 * @param sources - How to read each page's source, keyed by its file path.
 */
const DocsSearch = ({ pages, sources }: DocsSearchProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<readonly SearchEntry[] | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isTyping =
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((wasOpen) => !wasOpen);
      } else if (event.key === '/' && !isTyping) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || entries !== null) {
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
    )
      .then(setEntries)
      .catch(() => {
        setEntries(
          pages.map((page) => ({
            path: page.path,
            title: page.title,
            sectionTitle: page.sectionTitle,
            text: page.description,
          })),
        );
      });
  }, [entries, isOpen, pages, sources]);

  const groups = groupResults(
    query.trim() === ''
      ? pages.map((page) => ({
          path: page.path,
          title: page.title,
          sectionTitle: page.sectionTitle,
          detail: page.description,
        }))
      : searchDocs(entries ?? [], query).map((result) => ({
          path: result.path,
          title: result.title,
          sectionTitle: result.sectionTitle,
          detail: result.snippet,
        })),
  );

  return (
    <>
      <Button
        variant="subtle"
        size="sm"
        isPill
        label="Search the documentation"
        className="w-full max-w-md justify-between gap-3 text-text-muted"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <span className="flex items-center gap-2">
          <Icon of={SearchIcon} size={16} tone="muted" />
          Search the docs
        </span>

        <span aria-hidden className="rounded-md border border-border px-1.5 text-xs">
          Ctrl K
        </span>
      </Button>

      <CommandPalette
        label="Search the documentation"
        isOpen={isOpen}
        onClose={close}
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        placeholder="Search every page"
        emptyLabel={
          entries === null || entries.length === 0
            ? 'Reading the pages...'
            : 'Nothing matches that.'
        }
        onSelect={(path) => {
          close();
          void navigate({ to: path });
        }}
      />
    </>
  );
};

DocsSearch.displayName = 'DocsSearch';

export type { DocsSearchProps };

export { DocsSearch };
