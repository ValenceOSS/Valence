import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
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

        <motion.ul
          initial="hidden"
          animate="shown"
          variants={groupVariants}
          className="flex flex-col gap-1"
        >
          {section.items.map((item, index) => (
            <RevealItem key={item.path} index={index} className="list-none">
              <Link
                to={item.path}
                {...(onNavigate === undefined ? {} : { onClick: onNavigate })}
                className="block rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
                activeProps={{
                  className: 'bg-accent/10 font-medium text-accent hover:text-accent',
                }}
              >
                {item.title}
              </Link>
            </RevealItem>
          ))}
        </motion.ul>
      </div>
    ))}
  </nav>
);

DocsNav.displayName = 'DocsNav';

export type { DocsNavProps };

export { DocsNav };
