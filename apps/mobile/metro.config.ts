import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { getDefaultConfig } from 'expo/metro-config';
import type { MetroConfig } from 'expo/metro-config';

const ONE_COPY = ['react', '@tanstack/react-query'] as const;

const FROM_THE_PHONE = join(import.meta.dirname, 'package.json');

const RELEASES = join(import.meta.dirname, '..', '..', '.release-please-manifest.json');

const ReleasesSchema = z.object({ '.': z.string() });

const UNRELEASED = '0.0.0';

/**
 * The version of Valence this phone is built from, as the last release recorded it.
 *
 * Read here, while the bundle is made, and handed to the bundle through a public environment
 * variable, which Expo writes into the code in place of the name — a phone has no `package.json` to
 * ask at runtime, and every one in the workspace says 0.0.0 anyway.
 *
 * @returns The version, or 0.0.0 where the record cannot be read.
 */
const releasedVersion = (): string => {
  try {
    const read = ReleasesSchema.safeParse(JSON.parse(readFileSync(RELEASES, 'utf8')));

    return read.success ? read.data['.'] : UNRELEASED;
  } catch {
    return UNRELEASED;
  }
};

process.env['EXPO_PUBLIC_VALENCE_VERSION'] = releasedVersion();

const theDefaults: MetroConfig = getDefaultConfig(import.meta.dirname);

type Resolve = NonNullable<MetroConfig['resolver']['resolveRequest']>;

/**
 * Whether an import is one of the packages the whole bundle must share a single copy of.
 *
 * @param moduleName - What was imported.
 * @returns Whether it is one of them, or a file inside one.
 */
const isShared = (moduleName: string): boolean =>
  ONE_COPY.some((name) => moduleName === name || moduleName.startsWith(`${name}/`));

/**
 * Resolves React and React Query from the phone's own copies wherever they are imported, so the
 * workspace packages, which pnpm links against the web's React, share the phone's instead.
 *
 * @param context - Metro's resolution context.
 * @param moduleName - What was imported.
 * @param platform - Which platform is being bundled.
 * @returns Where it resolves.
 */
const resolveRequest: Resolve = (context, moduleName, platform) =>
  context.resolveRequest(
    isShared(moduleName) ? { ...context, originModulePath: FROM_THE_PHONE } : context,
    moduleName,
    platform,
  );

const config: MetroConfig = {
  ...theDefaults,
  resolver: { ...theDefaults.resolver, resolveRequest },
};

// oxlint-disable-next-line import/no-default-export -- Metro reads its config from the default export
export default config;
