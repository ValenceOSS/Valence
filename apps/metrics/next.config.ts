import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: REPOSITORY_ROOT,
  turbopack: { root: REPOSITORY_ROOT },
  transpilePackages: ['@valence/ui', '@valence/contracts', '@valence/core', '@valence/i18n'],
  poweredByHeader: false,
  agentRules: false,
  experimental: { useTypeScriptCli: true },
  typescript: { tsconfigPath: 'tsconfig.next.json', ignoreBuildErrors: true },
};

export default config;
