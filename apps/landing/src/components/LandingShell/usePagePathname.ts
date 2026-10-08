import { useContext } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { PagePathnameContext } from '@ValenceLanding/components/LandingShell/PagePathnameContext';

/**
 * The address a page was drawn for. While a page is fading out the router has already moved on, so
 * reading the router directly would redraw the leaving page as whatever the new address means to it —
 * a release page briefly saying it cannot find the changelog. Inside the shell the page keeps the
 * address it arrived with; outside it, as in a test, it falls back to the router's.
 *
 * @returns The pathname the page belongs to.
 */
const usePagePathname = (): string => {
  const held = useContext(PagePathnameContext);
  const current = useRouterState({ select: (state) => state.location.pathname });

  return held ?? current;
};

export { usePagePathname };
