import { defineConfig } from 'oxfmt';

export default defineConfig({
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  sortPackageJson: false,
  ignorePatterns: [
    '*.icon/',
    'pnpm-lock.yaml',
    '**/drizzle/**/meta/**',
    'CHANGELOG.md',
    '**/*.toml',
  ],
});
