import { join } from 'node:path';
import { getDefaultConfig } from 'expo/metro-config.js';
import type { MetroConfig } from 'expo/metro-config.js';

const ONE_COPY = ['react', '@tanstack/react-query'] as const;

const FROM_THE_PHONE = join(import.meta.dirname, 'package.json');

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
