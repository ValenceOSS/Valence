import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDefaultConfig } from 'expo/metro-config.js';

type Resolve = (
  context: { resolveRequest: Resolve; originModulePath: string },
  moduleName: string,
  platform: string | null,
) => unknown;

type Paths = { compilerOptions: { paths: Record<string, string[]> } };

const HERE = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = resolve(HERE, '..', '..');

const THIS_FILE = join(HERE, 'metro.config.ts');

const SINGLETONS = ['react', 'react-native', '@tanstack/react-query'];

const aliases = (): { wildcards: { prefix: string; target: string }[]; exact: Map<string, string> } => {
  const read: Paths = JSON.parse(readFileSync(join(REPO_ROOT, 'tsconfig.paths.json'), 'utf8'));
  const entries = Object.entries(read.compilerOptions.paths).flatMap(([pattern, targets]) =>
    targets[0] === undefined ? [] : [[pattern, targets[0]] as const],
  );

  return {
    wildcards: entries
      .filter(([pattern]) => pattern.endsWith('/*'))
      .map(([pattern, target]) => ({
        prefix: pattern.slice(0, -1),
        target: resolve(REPO_ROOT, target).slice(0, -1),
      })),
    exact: new Map(
      entries
        .filter(([pattern]) => !pattern.endsWith('/*'))
        .map(([pattern, target]) => [pattern, resolve(REPO_ROOT, target)]),
    ),
  };
};

const { wildcards, exact } = aliases();

const isSingleton = (name: string): boolean =>
  SINGLETONS.some((singleton) => name === singleton || name.startsWith(`${singleton}/`));

const config = getDefaultConfig(HERE);

const resolveRequest: Resolve = (context, moduleName, platform) => {
  if (isSingleton(moduleName)) {
    try {
      return context.resolveRequest({ ...context, originModulePath: THIS_FILE }, moduleName, platform);
    } catch {
      return context.resolveRequest(context, moduleName, platform);
    }
  }

  const named = exact.get(moduleName);

  if (named !== undefined) {
    return context.resolveRequest(context, named, platform);
  }

  const wildcard = wildcards.find((candidate) => moduleName.startsWith(candidate.prefix));

  if (wildcard !== undefined) {
    return context.resolveRequest(
      context,
      wildcard.target + moduleName.slice(wildcard.prefix.length),
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

export default { ...config, resolver: { ...config.resolver, resolveRequest } };
