import { Outlet } from '@tanstack/react-router';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import { DocsNav } from '@ValenceDocs/components/DocsNav/DocsNav';
import { DocsTopBar } from '@ValenceDocs/components/DocsTopBar/DocsTopBar';

/**
 * The frame every page sits in: the top bar, the list of pages beside it and the page itself.
 */
const DocsShell = () => (
  <div className="min-h-dvh bg-surface text-text">
    <DocsTopBar />

    <div className="mx-auto flex max-w-[96rem]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-border lg:block">
        <DocsNav sections={NAVIGATION} />
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  </div>
);

DocsShell.displayName = 'DocsShell';

export { DocsShell };
