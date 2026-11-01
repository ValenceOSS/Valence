import { z } from 'zod';
import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';
import { browserOf } from '@ValenceCore/functions/browserOf';

type Page = {
  navigator: Navigator;
  matchMedia?: (query: string) => { matches: boolean };
  CSS?: { supports: (property: string, value: string) => boolean };
};

const IPAD_TOUCHES = 3;

const BrandsSchema = z.object({
  userAgentData: z.object({ brands: z.array(z.object({ brand: z.string() })).max(20) }),
});

const OnAHomeScreenSchema = z.object({ standalone: z.literal(true) });

const BraveSchema = z.object({ brave: z.object({}) });

const TouchSchema = z.object({ maxTouchPoints: z.number().min(IPAD_TOUCHES) });

const AskableSchema = z.object({
  userAgentData: z.object({
    getHighEntropyValues: z.custom<(hints: string[]) => Promise<object>>(
      (asked) => typeof asked === 'function',
    ),
  }),
});

const ModelSchema = z.object({ model: z.string().trim().min(1).max(80) });

const APPLE_COMPUTER = /\bMacintosh\b/u;

const asked: { model: string | null; isAsking: boolean } = { model: null, isAsking: false };

/**
 * Asks a browser that keeps its model to itself unless asked — Chrome on Android, which names a
 * "Pixel 9" this way and only "K" in its user agent — for the model, once, keeping the answer for
 * every request after it.
 *
 * @param navigator - The browser.
 */
const askForTheModel = (navigator: Navigator): void => {
  const askable = AskableSchema.safeParse(navigator);

  if (!askable.success) {
    return;
  }

  void askable.data.userAgentData
    .getHighEntropyValues(['model'])
    .then((answer) => {
      const read = ModelSchema.safeParse(answer);

      asked.model = read.success ? read.data.model : null;
    })
    .catch(() => undefined);
};

/**
 * What this browser can say about its device that its user agent cannot: that Valence was opened
 * from a home screen rather than in a browser tab, that an iPad asking for the desktop site is an
 * iPad and not the Mac it claims to be, that Brave is Brave where it calls itself Chrome, and the
 * model a phone's browser names when asked. An iPad is told from a Mac by the several fingers its
 * screen takes together and by a style only Apple's mobile WebKit understands, rather than by touch
 * alone, so a Mac with a touchscreen is still a Mac.
 *
 * @param page - The page, this one unless a test says otherwise.
 * @returns What to tell the server.
 */
const hintsAboutThisBrowser = (page: Page = globalThis): DeviceHints => {
  const { navigator } = page;

  if (!asked.isAsking) {
    asked.isAsking = true;
    askForTheModel(navigator);
  }

  const brands = BrandsSchema.safeParse(navigator);
  const isOnAHomeScreen =
    OnAHomeScreenSchema.safeParse(navigator).success ||
    (page.matchMedia?.('(display-mode: standalone)').matches ?? false);
  const isAnIpad =
    APPLE_COMPUTER.test(navigator.userAgent) &&
    TouchSchema.safeParse(navigator).success &&
    (page.CSS?.supports('-webkit-touch-callout', 'none') ?? false);
  const browser = BraveSchema.safeParse(navigator).success
    ? 'brave'
    : browserOf(
        navigator.userAgent,
        brands.success ? brands.data.userAgentData.brands.map((one) => one.brand) : [],
      );

  return {
    ...(isOnAHomeScreen ? { app: 'webApp' } : {}),
    ...(isAnIpad ? { system: 'ipados', form: 'tablet' } : {}),
    ...(browser === null ? {} : { browser }),
    ...(asked.model === null ? {} : { model: asked.model }),
  };
};

export { hintsAboutThisBrowser };
