import { Link } from '@tanstack/react-router';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import type { UiLibrarySidebarProps } from './UiLibrarySidebar.types';

/**
 * The list down the side of the UI library: a search field like the app's own, which stays at
 * the top as the list scrolls, then every component under the group it belongs to, with one highlight that slides from name to name under the pointer as the app's own
 * sidebar does, and the component being looked at marked as the current page.
 *
 * @param groups - The components to list, already grouped and narrowed.
 * @param selected - The component being looked at, or null for none.
 * @param query - What the list is narrowed to.
 * @param onQueryChange - Told what was typed into the search box.
 * @param onChoose - Told a component was chosen, for a drawer that should close when one is.
 */
const UiLibrarySidebar = ({
  groups,
  selected,
  query,
  onQueryChange,
  onChoose,
}: UiLibrarySidebarProps) => {
  const { containerRef, rect, follow, clear } = useSlidingHighlight();

  return (
    <nav aria-label="Components" className="flex flex-col gap-4">
      <div className="sticky -top-3 z-20 -mx-3 -mt-3 bg-surface-raised p-3 pb-2">
        <TextField
          label="Find a component"
          isLabelHidden
          type="search"
          size="md"
          placeholder="Find a component"
          value={query}
          onValueChange={onQueryChange}
        />
      </div>

      <div
        ref={containerRef}
        className="relative flex flex-col gap-5"
        onPointerMove={follow}
        onPointerLeave={clear}
      >
        <HoverHighlight rect={rect} radius="md" />

        {groups.length === 0 ? (
          <p className="px-3 text-sm text-text-muted">Nothing matches that.</p>
        ) : null}

        {groups.map((group) => (
          <section key={group.name} aria-label={group.name} className="flex flex-col gap-0.5">
            <h2 className="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {group.name}
            </h2>

            {group.components.map((doc) => {
              const isHere = doc.name === selected;

              return (
                <Link
                  key={doc.name}
                  to="/ui/$component"
                  resetScroll={false}
                  params={{ component: doc.name.toLowerCase() }}
                  data-highlight={doc.name}
                  aria-current={isHere ? 'page' : undefined}
                  onClick={onChoose}
                  className={cn(
                    'relative z-10 rounded-md px-3 py-1.5 text-sm transition-colors',
                    isHere
                      ? 'bg-[var(--surface-active)] font-semibold text-text'
                      : 'text-text-muted hover:text-text',
                  )}
                >
                  {doc.name}
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </nav>
  );
};

UiLibrarySidebar.displayName = 'UiLibrarySidebar';

export { UiLibrarySidebar };
