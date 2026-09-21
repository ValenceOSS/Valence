import { AppliedFilters } from '@ValenceUI/AppliedFilters';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { useCatalogueFilters } from '@ValenceScreens/requests/useCatalogueFilters';
import { CatalogueGrid } from '@ValenceScreens/components/RequestsPage/components/CatalogueGrid/CatalogueGrid';
import type { CatalogueBrowserProps } from './CatalogueBrowser.types';

/**
 * A whole list of films or series to ask for, with the means to narrow it: a filter menu for genre,
 * decade and rating, and the choices made shown as chips beneath it, each removable, before the grid.
 *
 * The narrowing is put to the catalogue rather than done here, since the list is far longer than
 * what has been read of it.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param onAsk - Called with the title to open, as its address names it.
 */
const CatalogueBrowser = ({ browsing, onAsk }: CatalogueBrowserProps) => {
  const filters = useCatalogueFilters(browsing.kind);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        {filters.groups.length === 0 ? null : (
          <FilterMenu
            label={browsing.kind === 'film' ? 'Filter films' : 'Filter series'}
            hasLabel
            groups={filters.groups}
            selected={filters.selected}
            onChange={filters.change}
          />
        )}
      </div>

      <AppliedFilters
        groups={filters.groups}
        selected={filters.selected}
        onRemove={(id) => {
          const next = new Set(filters.selected);

          next.delete(id);
          filters.change(next);
        }}
        onClear={filters.clear}
      />

      <CatalogueGrid browsing={browsing} filters={filters.asked} onAsk={onAsk} />
    </div>
  );
};

CatalogueBrowser.displayName = 'CatalogueBrowser';

export { CatalogueBrowser };
