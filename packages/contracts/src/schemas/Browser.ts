import { z } from 'zod';

const BROWSERS = [
  'chrome',
  'chromium',
  'edge',
  'opera',
  'brave',
  'vivaldi',
  'samsungInternet',
  'yandex',
  'duckDuckGo',
  'firefox',
  'safari',
] as const;

const BrowserSchema = z.enum(BROWSERS);

type Browser = z.infer<typeof BrowserSchema>;

export type { Browser };

export { BROWSERS, BrowserSchema };
