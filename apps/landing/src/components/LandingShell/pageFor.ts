import type { ComponentType } from 'react';
import { HomePage } from '@ValenceLanding/components/HomePage/HomePage';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import { lazyNamed } from '@ValenceLanding/lazyNamed';
import type { Preloadable } from '@ValenceLanding/lazyNamed';

const ChangelogPage = lazyNamed(
  () => import('@ValenceLanding/components/ChangelogPage/ChangelogPage'),
  'ChangelogPage',
);
const PluginsPage = lazyNamed(
  () => import('@ValenceLanding/components/PluginsPage/PluginsPage'),
  'PluginsPage',
);
const ChangelogEntryPage = lazyNamed(
  () => import('@ValenceLanding/components/ChangelogEntryPage/ChangelogEntryPage'),
  'ChangelogEntryPage',
);
const FeaturesPage = lazyNamed(
  () => import('@ValenceLanding/components/FeaturesPage/FeaturesPage'),
  'FeaturesPage',
);
const DownloadsPage = lazyNamed(
  () => import('@ValenceLanding/components/DownloadsPage/DownloadsPage'),
  'DownloadsPage',
);
const BrandPage = lazyNamed(
  () => import('@ValenceLanding/components/BrandPage/BrandPage'),
  'BrandPage',
);
const PrivacyPage = lazyNamed(
  () => import('@ValenceLanding/components/PrivacyPage/PrivacyPage'),
  'PrivacyPage',
);
const TermsPage = lazyNamed(
  () => import('@ValenceLanding/components/TermsPage/TermsPage'),
  'TermsPage',
);
const UiLibraryPage = lazyNamed(
  () => import('@ValenceLanding/components/UiLibraryPage/UiLibraryPage'),
  'UiLibraryPage',
);

const PAGES: Record<string, ComponentType | Preloadable> = {
  '/': HomePage,
  '/changelog': ChangelogPage,
  '/features': FeaturesPage,
  '/downloads': DownloadsPage,
  '/plugins': PluginsPage,
  '/brand': BrandPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
  '/ui': UiLibraryPage,
};

/**
 * The page drawn at an address: one of the site's own, a changelog entry, a UI catalogue page, or
 * the page for an address that isn't one.
 *
 * @param pathname - The address.
 * @returns The page, which a lazily fetched one can `preload`.
 */
const pageFor = (pathname: string): ComponentType | Preloadable =>
  PAGES[pathname] ??
  (pathname.startsWith('/changelog/')
    ? ChangelogEntryPage
    : pathname.startsWith('/ui/')
      ? UiLibraryPage
      : PageProblem);

export { pageFor };
