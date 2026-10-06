import { Outlet } from '@tanstack/react-router';
import { DocsTopBar } from '@ValenceDocs/components/DocsTopBar/DocsTopBar';

/**
 * The frame every page sits in: the bar floating across the top, and the page beneath it on the
 * darker grey every Valence site shares, its parts laid out as cards.
 */
const DocsShell = () => (
  <div className="min-h-dvh overflow-x-clip bg-[var(--frame-back)] pb-3 text-text">
    <DocsTopBar />

    <main>
      <Outlet />
    </main>
  </div>
);

DocsShell.displayName = 'DocsShell';

export { DocsShell };
