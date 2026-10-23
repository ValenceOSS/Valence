import { scrollKeyOf } from '@ValenceScreens/routes/scrollKeyOf';

type Somewhere = { pathname: string; searchStr: string };

/**
 * Makes the router's rule for when to put remembered scroll positions back: only on arriving at a
 * different page. The router remembers every element that scrolled by where it sits in the page, so
 * restoring as a dialog opens over the same page hands the new dialog's rows the scroll of the last
 * dialog's rows, which sat in the same place.
 *
 * @returns The rule, told each address the router renders.
 */
const restoresScrollBetweenPages = (): ((asked: { location: Somewhere }) => boolean) => {
  let shown: string | null = null;

  return ({ location }) => {
    const key = scrollKeyOf(location);
    const isAnotherPage = key !== shown;

    shown = key;

    return isAnotherPage;
  };
};

export { restoresScrollBetweenPages };
