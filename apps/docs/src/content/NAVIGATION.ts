import { buildNavigation } from '@ValenceDocs/content/buildNavigation';
import { DOC_PAGES } from '@ValenceDocs/content/DOC_PAGES';

const NAVIGATION = buildNavigation(DOC_PAGES, [
  { section: 'reference', path: '/api', title: 'API reference', order: 1.5 },
]);

export { NAVIGATION };
