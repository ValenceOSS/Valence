import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'refactor',
        'test',
        'perf',
        'build',
        'ci',
        'style',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'web',
        'landing',
        'server',
        'transcoder',
        'requests',
        'desktop',
        'ui',
        'contracts',
        'core',
        'plugin-sdk',
        'auth',
        'docs',
        'deps',
        'repo',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
  },
};

export default config;
