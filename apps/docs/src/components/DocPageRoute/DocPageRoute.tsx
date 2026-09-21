import { useRouterState } from '@tanstack/react-router';
import { DOC_PAGES } from '@ValenceDocs/content/DOC_PAGES';
import { DocPageView } from '@ValenceDocs/components/DocPageView/DocPageView';
import { DocsNotFound } from '@ValenceDocs/components/DocsNotFound/DocsNotFound';

/**
 * Finds the page the address names and shows it, or says there is no such page.
 */
const DocPageRoute = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const page = DOC_PAGES.find((candidate) => candidate.path === pathname.replace(/\/$/u, ''));

  return page === undefined ? <DocsNotFound /> : <DocPageView page={page} />;
};

DocPageRoute.displayName = 'DocPageRoute';

export { DocPageRoute };
