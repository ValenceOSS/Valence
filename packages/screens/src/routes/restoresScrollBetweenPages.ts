/**
 * Makes the router's rule for when to put remembered scroll positions back: only on arriving at a
 * different visit to a page, by a link or by going back or forward. The router remembers every
 * element that scrolled by where it sits in the page, so restoring as a dialog opens over the same
 * visit hands the new dialog's rows the scroll of the last dialog's rows, which sat in the same place.
 *
 * @param keyOf - Which visit to a page a location belongs to.
 * @returns The rule, told each address the router renders.
 */
const restoresScrollBetweenPages = <Location>(
  keyOf: (location: Location) => string,
): ((asked: { location: Location }) => boolean) => {
  let shown: string | null = null;

  return ({ location }) => {
    const key = keyOf(location);
    const isAnotherVisit = key !== shown;

    shown = key;

    return isAnotherVisit;
  };
};

export { restoresScrollBetweenPages };
