import { UPSTREAM_DOCS } from './UPSTREAM_DOCS';

const RADIX = /^@radix-ui\/react-(?<slug>[a-z-]+)$/u;

/**
 * Names the third-party library an import comes from and where its props are documented, for the
 * libraries a ValenceUI component can be built on. A Radix primitive's page is found from the
 * package's own name; everything else is looked up. Anything that is not a UI library — React
 * itself, class-name helpers, icons — has no page to point at.
 *
 * @param specifier - The module an import names, such as `@radix-ui/react-dialog`.
 * @returns The library's name and its documentation, or null.
 */
const upstreamOf = (specifier: string): { name: string; url: string } | null => {
  const slug = RADIX.exec(specifier)?.groups?.slug;

  if (slug !== undefined) {
    const words = slug.split('-').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`);

    return {
      name: `Radix ${words.join(' ')}`,
      url: `https://www.radix-ui.com/primitives/docs/components/${slug}`,
    };
  }

  return UPSTREAM_DOCS[specifier] ?? null;
};

export { upstreamOf };
