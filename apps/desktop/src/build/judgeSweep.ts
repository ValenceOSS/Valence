import type { SweepSample } from './SweepSample';

type SweepLimits = { heapMb: number; nodes: number; listeners: number };

type SweepFinding = {
  route: string;
  heapGrowthMb: number;
  nodeGrowth: number;
  listenerGrowth: number;
  isLeaking: boolean;
};

const LIMITS: SweepLimits = { heapMb: 5, nodes: 200, listeners: 50 };

/**
 * Judges a leak sweep: for each route, how much the heap, the DOM nodes and the listeners grew from
 * the second pass to the last, after a garbage collection each time. The first pass is left out,
 * because a page's first visit fills caches it then keeps. A route leaks where any of the three grew
 * past its limit, since a page that comes back to the same size each time does not.
 *
 * @param samples - Every measurement the sweep took.
 * @param limits - How much growth is allowed before a route counts as leaking.
 * @returns One finding per route, in the order the routes were first measured.
 */
const judgeSweep = (
  samples: readonly SweepSample[],
  limits: SweepLimits = LIMITS,
): SweepFinding[] => {
  const routes = [...new Set(samples.map((sample) => sample.route))];

  return routes.map((route) => {
    const passes = samples
      .filter((sample) => sample.route === route)
      .sort((one, other) => one.pass - other.pass);
    const settled = passes.length > 1 ? passes.slice(1) : passes;
    const first = settled[0];
    const last = settled.at(-1);
    const heapGrowthMb = first === undefined || last === undefined ? 0 : last.heapMb - first.heapMb;
    const nodeGrowth = first === undefined || last === undefined ? 0 : last.nodes - first.nodes;
    const listenerGrowth =
      first === undefined || last === undefined ? 0 : last.listeners - first.listeners;

    return {
      route,
      heapGrowthMb,
      nodeGrowth,
      listenerGrowth,
      isLeaking:
        heapGrowthMb > limits.heapMb ||
        nodeGrowth > limits.nodes ||
        listenerGrowth > limits.listeners,
    };
  });
};

export type { SweepFinding, SweepLimits };
export { judgeSweep };
