import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import theExpoPreset from 'jest-expo/jest-preset.js';
import type { Config } from 'jest';

const ROOT = join(import.meta.dirname, '..', '..');

const PUBLISHED_AS_MODULES = [
  'better-auth',
  '@better-auth',
  '@better-fetch',
  'nanostores',
  'jose',
  '@keyline-icons',
];

const TypeScriptPathsSchema = z.object({
  compilerOptions: z.object({ paths: z.record(z.string(), z.array(z.string())) }),
});

const ExpoPresetSchema = z.object({ transformIgnorePatterns: z.array(z.string()).default([]) });

/**
 * The workspace aliases, as Jest wants them.
 *
 * Read out of the same file TypeScript reads rather than listed again here. There are a hundred and
 * eighty of them and they change whenever a component is added, so a second copy would be wrong
 * within the week — and wrong in the way that is hardest to see, since a stale alias resolves to
 * something that merely used to exist.
 *
 * @returns A mapping from each alias to where it actually is.
 */
const theWorkspaceAliases = (): Record<string, string> => {
  const read = TypeScriptPathsSchema.parse(
    JSON.parse(readFileSync(join(ROOT, 'tsconfig.paths.json'), 'utf8')),
  );

  return Object.fromEntries(
    Object.entries(read.compilerOptions.paths).map(([alias, [target]]) => [
      `^${alias.replace('/*', '')}/(.*)$`,
      `<rootDir>/../../${(target ?? '').replace('./', '').replace('/*', '')}/$1`,
    ]),
  );
};

/**
 * What Jest may leave untransformed, which is Expo's answer plus the few dependencies that ship
 * only as modules.
 *
 * Expo's own list is extended rather than restated: it names every React Native package that has to
 * be compiled, and replacing it stops React Native's own test setup from loading at all. What it
 * does not know about is what Valence depends on — better-auth and its neighbours publish ESM and
 * nothing else, so Jest has to be told to compile them rather than require them.
 *
 * @returns The patterns, with those modules folded into Expo's own.
 */
const whatNeedsCompiling = (): string[] =>
  ExpoPresetSchema.parse(theExpoPreset).transformIgnorePatterns.map((pattern) =>
    pattern.includes('.pnpm')
      ? pattern.replace('(?!(.pnpm', `(?!(.pnpm|${PUBLISHED_AS_MODULES.join('|')}`)
      : pattern,
  );

const config: Config = {
  preset: 'jest-expo',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'node'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
    '^.+\\.mjs$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^@tanstack/react-query$': '<rootDir>/node_modules/@tanstack/react-query',
    ...theWorkspaceAliases(),
  },
  transformIgnorePatterns: whatNeedsCompiling(),
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.beforeEach.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  testTimeout: 20_000,
  coverageReporters: ['text', 'json-summary'],
};

export default config;
