import { Link } from '@tanstack/react-router';
import type { NavSection } from '@ValenceDocs/content/DocPage.types';

type DocsNavProps = {
  sections: readonly NavSection[];
  onNavigate?: () => void;
};

/**
 * The list of every page, grouped by section, with the page being read marked.
 *
 * @param sections - What to list.
 * @param onNavigate - Called when a page is chosen, so a drawer showing this can close itself.
 */
const DocsNav = ({ sections, onNavigate }: DocsNavProps) => (
  <nav aria-label="Documentation" className="flex flex-col gap-7 px-4 py-6">
    {sections.map((section) => (
      <div key={section.id} className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {section.title}
        </p>

        {section.items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            {...(onNavigate === undefined ? {} : { onClick: onNavigate })}
            className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
            activeProps={{ className: 'bg-accent/10 font-medium text-accent hover:text-accent' }}
          >
            {item.title}
          </Link>
        ))}
      </div>
    ))}
  </nav>
);

DocsNav.displayName = 'DocsNav';

export type { DocsNavProps };

export { DocsNav };
