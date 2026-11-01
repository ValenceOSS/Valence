import { z } from 'zod';
import { BrowserSchema } from '@ValenceContracts/schemas/Browser';

const DEVICE_APPS = ['browser', 'webApp', 'desktop', 'phone', 'tv'] as const;

const DEVICE_SYSTEMS = [
  'ios',
  'ipados',
  'android',
  'macos',
  'windows',
  'linux',
  'chromeos',
  'tvos',
  'androidTv',
  'fireOs',
  'webos',
  'tizen',
  'xbox',
] as const;

const DEVICE_FORMS = ['phone', 'tablet', 'computer', 'tv', 'console'] as const;

const IN_APP_BROWSERS = [
  'facebook',
  'messenger',
  'instagram',
  'whatsapp',
  'tiktok',
  'snapchat',
  'linkedin',
  'line',
  'pinterest',
  'unnamed',
] as const;

const DEVICE_WORDS_LONGEST = 80;

const DeviceAppSchema = z.enum(DEVICE_APPS);

const DeviceSystemSchema = z.enum(DEVICE_SYSTEMS);

const DeviceFormSchema = z.enum(DEVICE_FORMS);

const InAppBrowserSchema = z.enum(IN_APP_BROWSERS);

const DeviceWordsSchema = z.string().trim().min(1).max(DEVICE_WORDS_LONGEST);

const DeviceIdentitySchema = z.object({
  app: DeviceAppSchema.catch('browser'),
  system: DeviceSystemSchema.nullable().catch(null),
  form: DeviceFormSchema.nullable().catch(null),
  browser: BrowserSchema.nullable().catch(null),
  inApp: InAppBrowserSchema.nullable().catch(null),
  maker: DeviceWordsSchema.nullable().catch(null),
  model: DeviceWordsSchema.nullable().catch(null),
  name: DeviceWordsSchema.nullable().catch(null),
});

const DeviceIdentityWireSchema = z.object({
  app: z.string().max(DEVICE_WORDS_LONGEST),
  system: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
  form: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
  browser: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
  inApp: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
  maker: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
  model: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
  name: z.string().max(DEVICE_WORDS_LONGEST).nullable(),
});

type DeviceApp = z.infer<typeof DeviceAppSchema>;

type DeviceSystem = z.infer<typeof DeviceSystemSchema>;

type DeviceForm = z.infer<typeof DeviceFormSchema>;

type InAppBrowser = z.infer<typeof InAppBrowserSchema>;

type DeviceIdentity = z.infer<typeof DeviceIdentitySchema>;

export type { DeviceApp, DeviceForm, DeviceIdentity, DeviceSystem, InAppBrowser };

export {
  DEVICE_APPS,
  DEVICE_FORMS,
  DEVICE_SYSTEMS,
  DEVICE_WORDS_LONGEST,
  DeviceAppSchema,
  DeviceFormSchema,
  DeviceIdentitySchema,
  DeviceIdentityWireSchema,
  DeviceSystemSchema,
  DeviceWordsSchema,
  IN_APP_BROWSERS,
  InAppBrowserSchema,
};
