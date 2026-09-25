import type { CaptureScreen } from './CaptureScreen';

const DRAWN_IN_A_BROWSER = new Set(['web', 'desktop']);

const PARAMETER = /\$(\w+)/gu;

/**
 * Which screens a headless browser can capture, and where it goes for each: every web and desktop
 * screen whose address can be filled in from what is given, leaving out those the phone, the
 * television or the server draw, which need a device of their own.
 *
 * @param screens - Every registered screen, by id.
 * @param parameters - Values for the `$name` parts of an address, such as a film to open.
 * @returns The screens to visit, each with its address filled in, and those that could not be.
 */
const planCaptures = (
  screens: Readonly<Record<string, CaptureScreen>>,
  parameters: Readonly<Record<string, string>>,
): { visits: { id: string; path: string; press: readonly string[] }[]; unfilled: string[] } => {
  const visits: { id: string; path: string; press: readonly string[] }[] = [];
  const unfilled: string[] = [];

  for (const [id, screen] of Object.entries(screens).toSorted(([a], [b]) => a.localeCompare(b))) {
    if (!DRAWN_IN_A_BROWSER.has(screen.client)) {
      continue;
    }

    const missing = [...screen.route.matchAll(PARAMETER)].some(
      ([, name = '']) => parameters[name] === undefined,
    );

    if (missing) {
      unfilled.push(id);

      continue;
    }

    visits.push({
      id,
      path: screen.route.replace(PARAMETER, (_, name: string) => parameters[name] ?? ''),
      press: screen.press ?? [],
    });
  }

  return { visits, unfilled };
};

export { planCaptures };
