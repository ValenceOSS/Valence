import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import theExpoPreset from 'jest-expo/jest-preset.js';
import type { Config } from 'jest';

const ROOT = join(import.meta.dirname, '..', '..');

const PUBLISHED_AS_MODULES = ['@keyline-icons', 'uqr'];

const TypeScriptPathsSchema = z.object({
  compilerOptions: z.object({ paths: z.record(z.string(), z.array(z.string())) }),
});

const ExpoPresetSchema = z.object({ transformIgnorePatterns: z.array(z.string()).default([]) });

/**
 * The workspace aliases, as Jest wants them, read out of the same file TypeScript reads rather than
 * listed again here, so an alias added for a new component reaches the tests too.
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
 * What Jest may leave untransformed: Expo's answer, plus the few dependencies that ship only as
 * modules and so have to be compiled rather than required.
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
  preset: 'jest-expo/ios',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'node'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
    '^.+\\.mjs$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^react-native/(.*)$': '<rootDir>/node_modules/react-native/$1',
    '^@tanstack/react-query$': '<rootDir>/node_modules/@tanstack/react-query',
    ...theWorkspaceAliases(),
  },
  transformIgnorePatterns: whatNeedsCompiling(),
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.beforeEach.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  testTimeout: 20_000,
  coverageReporters: ['text', 'json-summary'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.types.ts', '!src/testing/**'],
};

export default config;
