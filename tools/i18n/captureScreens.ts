import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { z } from 'zod';
import { planCaptures } from './planCaptures';

const ROOT = join(import.meta.dirname, '..', '..');

const IMAGES = join(ROOT, 'packages', 'i18n', 'images');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const SETTLES_MS = 600;

const ScreensSchema = z.record(
  z.string(),
  z.object({
    client: z.enum(['web', 'desktop', 'phone', 'tv', 'server']),
    route: z.string(),
    reach: z.string(),
    press: z.array(z.string()).default([]),
  }),
);

const SettingsSchema = z.object({
  VALENCE_CAPTURE_ORIGIN: z.string().default('https://localhost:5173'),
  VALENCE_CAPTURE_EMAIL: z.string().min(1),
  VALENCE_CAPTURE_PASSWORD: z.string().min(1),
  VALENCE_CAPTURE_PROFILE: z.string().optional(),
  VALENCE_CAPTURE_PARAMETERS: z.string().default(''),
  VALENCE_CAPTURE_ONLY: z.string().default(''),
  VALENCE_CAPTURE_CHROME: z.string().default(CHROME),
});

/**
 * Reads `name=value,name=value` into the values an address's `$name` parts are filled from.
 *
 * @param written - What was given.
 */
const readParameters = (written: string): Record<string, string> =>
  Object.fromEntries(
    written
      .split(',')
      .map((pair) => pair.split('='))
      .filter((pair): pair is [string, string] => pair.length === 2 && pair[0] !== ''),
  );

/**
 * Photographs every web and desktop screen in the screens file, signed in over the API as the
 * account the environment names, into packages/i18n/images, one picture per screen for every
 * string that points at it. The phone's and the television's screens are listed at the end, since
 * those are photographed on a device.
 */
const captureScreens = async (): Promise<void> => {
  const settings = SettingsSchema.parse(process.env);
  const screens = ScreensSchema.parse(
    JSON.parse(readFileSync(join(ROOT, 'packages', 'i18n', 'src', 'screens.json'), 'utf8')),
  );
  const only = new Set(settings.VALENCE_CAPTURE_ONLY.split(',').filter((id) => id !== ''));
  const { visits, unfilled } = planCaptures(
    screens,
    readParameters(settings.VALENCE_CAPTURE_PARAMETERS),
  );

  mkdirSync(IMAGES, { recursive: true });

  const browser = await chromium.launch({
    executablePath: settings.VALENCE_CAPTURE_CHROME,
    headless: true,
  });
  const context = await browser.newContext({
    baseURL: settings.VALENCE_CAPTURE_ORIGIN,
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });

  const signedIn = await context.request.post('/api/auth/sign-in/email', {
    data: {
      email: settings.VALENCE_CAPTURE_EMAIL,
      password: settings.VALENCE_CAPTURE_PASSWORD,
    },
  });

  if (!signedIn.ok()) {
    await browser.close();
    throw new Error(`Signing in was refused with ${signedIn.status().toString()}.`);
  }

  const page = await context.newPage();
  const failed: string[] = [];
  let captured = 0;

  if (settings.VALENCE_CAPTURE_PROFILE !== undefined) {
    await page.goto('/');
    await page
      .getByRole('button', { name: settings.VALENCE_CAPTURE_PROFILE, exact: true })
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined);
    await page.waitForTimeout(SETTLES_MS * 2);
  }

  for (const visit of visits) {
    if (only.size > 0 && !only.has(visit.id)) {
      continue;
    }

    try {
      await page.goto(visit.path);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

      for (const name of visit.press) {
        await page
          .getByRole('button', { name, exact: true })
          .or(page.getByRole('menuitem', { name, exact: true }))
          .or(page.getByRole('tab', { name, exact: true }))
          .or(page.getByRole('link', { name, exact: true }))
          .first()
          .click({ timeout: 5000 });
        await page.waitForTimeout(SETTLES_MS);
      }

      await page.waitForTimeout(SETTLES_MS);
      await page.screenshot({ path: join(IMAGES, `${visit.id}.png`) });
      captured += 1;
      process.stdout.write(`captured ${visit.id}\n`);
    } catch {
      failed.push(visit.id);
      process.stdout.write(`could not capture ${visit.id}\n`);
    }
  }

  await browser.close();

  const onADevice = Object.entries(screens)
    .filter(([, screen]) => screen.client === 'phone' || screen.client === 'tv')
    .map(([id]) => id);

  process.stdout.write(
    [
      '',
      `${captured.toString()} captured.`,
      `Could not capture (${failed.length.toString()}): ${failed.join(', ')}`,
      `Need VALENCE_CAPTURE_PARAMETERS for (${unfilled.length.toString()}): ${unfilled.join(', ')}`,
      `Captured on a device instead (${onADevice.length.toString()}): ${onADevice.join(', ')}`,
      '',
    ].join('\n'),
  );
};

await captureScreens();
