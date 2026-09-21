import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { DocContentProps, DocPage } from '@ValenceDocs/content/DocPage.types';

const loaded = new Map<string, LazyExoticComponent<ComponentType<DocContentProps>>>();

/**
 * Makes the component that loads a page's content the first time it is shown.
 *
 * Kept per page so that going back to a page renders the copy already loaded rather than a new lazy
 * component, which would suspend again.
 *
 * @param page - The page.
 * @returns A lazy component for its content.
 */
const lazyContent = (page: DocPage): LazyExoticComponent<ComponentType<DocContentProps>> => {
  const existing = loaded.get(page.path);

  if (existing !== undefined) {
    return existing;
  }

  const made = lazy(page.load);

  loaded.set(page.path, made);

  return made;
};

export { lazyContent };
