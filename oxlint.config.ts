import { defineConfig } from 'oxlint';

const PARENT_IMPORT_BAN = {
  group: ['../*'],
  message:
    'Parent-relative imports are banned. Use @ValenceUI/*, @ValenceCore/*, @ValenceContracts/*, @ValenceSDK/* or @ValenceI18n/*.',
};

const RETIRED_ICON_SET_BAN = {
  group: ['@hugeicons/*'],
  message:
    'Valence draws its icons from @keyline-icons/react, through @ValenceUI/Icon — see code standards section 10.',
};

const SHARED_IMPORT_BANS = [
  PARENT_IMPORT_BAN,
  {
    group: ['@tabler/icons-react', '@remixicon/react', 'lucide-react', '@phosphor-icons/*'],
    message:
      'Icons come from @keyline-icons/react, drawn by @ValenceUI/Icon — see code standards section 10.',
  },
  RETIRED_ICON_SET_BAN,
];

const LANDING_IMPORT_BANS = [
  PARENT_IMPORT_BAN,
  {
    group: ['@remixicon/react', 'lucide-react', '@phosphor-icons/*'],
    message:
      'getvalence.app draws its icons from @tabler/icons-react — see code standards section 10 for why the product itself uses @keyline-icons/react instead.',
  },
  RETIRED_ICON_SET_BAN,
];

const DIALECT_IMPORT_BANS = [
  {
    group: [
      'drizzle-orm/pg-core',
      'drizzle-orm/node-postgres',
      'drizzle-orm/node-postgres/*',
      'drizzle-orm/pglite',
      'drizzle-orm/pglite/*',
      'pg',
      '@electric-sql/pglite',
      '@electric-sql/pglite/*',
      'drizzle-orm/mysql-core',
      'drizzle-orm/mysql2',
      'drizzle-orm/mysql2/*',
      'mysql2',
      'mysql2/*',
    ],
    message:
      'Only a dialect folder speaks to one database. Reach it through #dialect/* — see "One query, several databases" in the coding standard.',
  },
  {
    group: [
      '@ValenceServer/db/postgres/*',
      '@ValenceRequests/db/postgres/*',
      '@ValenceDatabase/postgres/*',
      '@ValenceServer/db/mysql/*',
      '@ValenceRequests/db/mysql/*',
      '@ValenceDatabase/mysql/*',
    ],
    message:
      'Import a dialect file through #dialect/*, which the build resolves to the database it is for.',
  },
];

const SYNTAX_BANS = [
  {
    selector: 'JSXOpeningElement[name.name=/^(button|input|select|textarea|dialog|iframe)$/]',
    message:
      'Raw controls are banned. Compose Button, TextField, FilePicker, Dialog or EmbeddedVideo — see code standards section 9.',
  },
  {
    selector: 'TSUnknownKeyword',
    message: 'unknown is banned. Parse untrusted input through a Zod schema instead.',
  },
  {
    selector: 'TSAsExpression[typeAnnotation.typeName.name!="const"]',
    message: 'Type assertions are banned. Parse untrusted input through a Zod schema instead.',
  },
  {
    selector:
      'JSXOpeningElement[name.name="Icon"] > JSXAttribute[name.name="className"] > Literal[value=/\\btext-(text|text-muted|danger|on-scrim)\\b/]',
    message:
      'An icon is given its colour by tone, not by className. Use tone="muted" or tone="danger" — see code standards section 10.',
  },
  {
    selector:
      'JSXOpeningElement[name.name="Button"] > JSXAttribute[name.name="className"] > Literal[value=/\\bhover:text-text\\b/]',
    message:
      'A button that is muted until it is pointed at is variant="subtle", not a look in className — see code standards section 9.',
  },
  {
    selector:
      'JSXOpeningElement[name.name="Button"] > JSXAttribute[name.name="className"] > Literal[value=/(hover:bg-|\\bshadow-|\\btext-danger|\\bbg-surface|\\bborder\\b|rounded-full)/]',
    message:
      'A button takes its fill, border, corners and shadow from variant, isPill and the component around it, not className. Use variant="row", "glossy", "ghost", "danger" or "overlay" — see code standards section 9.',
  },
  {
    selector: 'JSXOpeningElement[name.name=/^(?!AnimatedIcon$)[A-Z][A-Za-z0-9]+Icon$/]',
    message:
      'An icon is drawn by @ValenceUI/Icon — <Icon of={HomeIcon} /> — not rendered directly, so how it is drawn is decided in one file.',
  },
  {
    selector:
      'JSXOpeningElement[name.name="Skeleton"] > JSXAttribute[name.name="className"] > Literal[value=/\\brounded\\b/]',
    message:
      'A skeleton takes its corners from shape, not className. Use shape="soft" or shape="round".',
  },
  {
    selector:
      'JSXOpeningElement[name.name=/^(FaceCircle|ProfileFace|HouseholdFace)$/] > JSXAttribute[name.name="className"] Literal[value=/\\b(rounded|shadow)/]',
    message:
      'A face takes its corners and shadow from shape and isLifted, not className. Use shape="tile" or isLifted.',
  },
  {
    selector:
      'JSXOpeningElement[name.name=/^(MusicArtwork|GlassPanel|ActionMenu|PanelCard)$/] > JSXAttribute[name.name="className"] Literal[value=/(\\brounded|\\bshadow-|\\bring-|\\bborder\\b|\\bhover:bg-|\\bbg-)/]',
    message:
      'A component takes its corners, shadow, ring, edge and fill from its own props — shape, isLifted, isHighlighted, radius or look — not className.',
  },
];

const ANCHOR_BAN = {
  selector: 'JSXOpeningElement[name.name="a"]',
  message: 'Raw links are banned in the app. Compose Link — see code standards section 9.',
};

const TYPE_BANS = SYNTAX_BANS.filter(
  ({ selector }) => selector === 'TSUnknownKeyword' || selector.startsWith('TSAsExpression'),
);

const TYPE_AWARE_RULES = [
  'typescript/await-thenable',
  'typescript/no-array-delete',
  'typescript/no-base-to-string',
  'typescript/no-duplicate-type-constituents',
  'typescript/no-floating-promises',
  'typescript/no-for-in-array',
  'typescript/no-implied-eval',
  'typescript/no-misused-promises',
  'typescript/no-redundant-type-constituents',
  'typescript/no-unnecessary-type-assertion',
  'typescript/no-unsafe-argument',
  'typescript/no-unsafe-assignment',
  'typescript/no-unsafe-call',
  'typescript/no-unsafe-enum-comparison',
  'typescript/no-unsafe-member-access',
  'typescript/no-unsafe-return',
  'typescript/no-unsafe-unary-minus',
  'typescript/only-throw-error',
  'typescript/prefer-promise-reject-errors',
  'typescript/require-await',
  'typescript/restrict-plus-operands',
  'typescript/restrict-template-expressions',
  'typescript/unbound-method',
  'typescript/no-unnecessary-condition',
  'typescript/switch-exhaustiveness-check',
] as const;

const DIALECT_FOLDERS = [
  'apps/server/src/db/postgres/**',
  'apps/requests/src/db/postgres/**',
  'packages/database/src/postgres/**',
  'apps/server/src/db/mysql/**',
  'apps/requests/src/db/mysql/**',
  'packages/database/src/mysql/**',
];

const TESTS = ['**/*.test.ts', '**/*.test.tsx'];

const DATABASE_TESTS = [
  'apps/server/src/**/*.test.ts',
  'apps/requests/src/**/*.test.ts',
  'packages/database/src/**/*.test.ts',
];

export default defineConfig({
  plugins: ['react', 'typescript', 'unicorn', 'import'],
  jsPlugins: ['./tools/dist/valence-oxlint.js'],
  options: { typeAware: true },
  env: { browser: true, es2024: true },
  ignorePatterns: [
    '**/dist/**',
    '**/dist-main/**',
    '**/dist-preload/**',
    '**/coverage/**',
    '**/node_modules/**',
    'target/**',
    '**/.turbo/**',
    '**/.astro/**',
  ],
  rules: {
    'no-console': 'error',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    eqeqeq: 'error',
    'no-unused-vars': 'error',
    'no-unused-expressions': 'error',
    'react/jsx-key': 'error',
    'react/no-danger': 'error',
    'react/rules-of-hooks': 'error',
    'import/no-duplicates': 'error',
    'import/no-default-export': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'react/set-state-in-effect': 'off',
    'react/purity': 'off',
    'react/incompatible-library': 'off',
    'typescript/no-misused-spread': 'off',
    'typescript/require-array-sort-compare': 'off',
    'typescript/no-useless-default-assignment': 'off',
    'typescript/no-meaningless-void-operator': 'off',
    'typescript/ban-ts-comment': 'error',
    'typescript/no-array-constructor': 'error',
    'typescript/no-duplicate-enum-values': 'error',
    'typescript/no-empty-object-type': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-extra-non-null-assertion': 'error',
    'typescript/no-misused-new': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-non-null-asserted-optional-chain': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-this-alias': 'error',
    'typescript/no-unnecessary-type-constraint': 'error',
    'typescript/no-unsafe-declaration-merging': 'error',
    'typescript/no-unsafe-function-type': 'error',
    'typescript/no-wrapper-object-types': 'error',
    'typescript/prefer-as-const': 'error',
    'typescript/prefer-namespace-keyword': 'error',
    'typescript/triple-slash-reference': 'error',
    'typescript/consistent-type-imports': 'error',
    ...Object.fromEntries(TYPE_AWARE_RULES.map((rule) => [rule, 'error'])),
    'valence/no-comments': 'error',
    'no-restricted-imports': ['error', { patterns: [...SHARED_IMPORT_BANS] }],
    'valence/banned-syntax': ['error', ...SYNTAX_BANS],
  },
  overrides: [
    {
      files: [
        'packages/ui/**/*.tsx',
        'packages/screens/**/*.tsx',
        'apps/web/**/*.tsx',
        'apps/desktop/**/*.tsx',
      ],
      rules: { 'valence/banned-syntax': ['error', ...SYNTAX_BANS, ANCHOR_BAN] },
    },
    {
      files: [
        'packages/ui/src/**/*.tsx',
        'packages/screens/src/**/*.tsx',
        'apps/web/src/**/*.tsx',
        'apps/landing/src/**/*.tsx',
        'apps/docs/src/**/*.tsx',
      ],
      rules: { 'valence/no-raw-colours': 'error' },
    },
    {
      files: [
        'packages/core/src/**/*.{ts,tsx}',
        'packages/contracts/src/**/*.{ts,tsx}',
        'apps/server/src/**/*.{ts,tsx}',
        'apps/requests/src/**/*.{ts,tsx}',
        'packages/client/src/**/*.{ts,tsx}',
        'packages/ui/src/**/*.{ts,tsx}',
        'packages/screens/src/**/*.{ts,tsx}',
        'apps/web/src/**/*.{ts,tsx}',
        'apps/desktop/src/**/*.{ts,tsx}',
        'apps/mobile/src/**/*.{ts,tsx}',
        'apps/tv/src/**/*.{ts,tsx}',
        'packages/native/src/**/*.{ts,tsx}',
      ],
      rules: { 'valence/no-hard-coded-strings': 'error' },
    },
    {
      files: [
        'apps/landing/src/**/*.ts',
        'apps/landing/src/**/*.tsx',
        'apps/docs/src/**/*.ts',
        'apps/docs/src/**/*.tsx',
      ],
      rules: { 'no-restricted-imports': ['error', { patterns: [...LANDING_IMPORT_BANS] }] },
    },
    {
      files: [
        'packages/ui/src/components/Button/Button.tsx',
        'packages/ui/src/components/TextField/TextField.tsx',
        'packages/ui/src/components/FilePicker/FilePicker.tsx',
        'packages/ui/src/components/EmbeddedVideo/EmbeddedVideo.tsx',
        'packages/ui/src/components/Link/Link.tsx',
      ],
      rules: { 'valence/banned-syntax': ['error', ...TYPE_BANS] },
    },
    {
      files: ['packages/ui/src/components/Icon/Icon.tsx'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      files: ['packages/client/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...SHARED_IMPORT_BANS,
              {
                group: ['@ValenceWeb/*'],
                message:
                  'The application cannot reach into a client. Anything it needs from one is a port on Platform.',
              },
              {
                group: ['@ValenceUI/*'],
                message:
                  'The application does not draw. A component belongs to a client, and a shape both need belongs to @ValenceContracts.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/native/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...SHARED_IMPORT_BANS,
              {
                group: ['@ValenceMobile/*', '@ValenceTv/*'],
                message:
                  'What the phone and the television share cannot reach into either of them. Anything one needs to do differently is passed in.',
              },
              {
                group: ['@ValenceWeb/*', '@ValenceScreens/*', '@ValenceUI/*'],
                message:
                  'The shared native code runs on a phone or a television, never in a browser, so it cannot use what draws the web.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/screens/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...SHARED_IMPORT_BANS,
              {
                group: ['@ValenceWeb/*'],
                message:
                  'A screen cannot reach into a client. Anything it needs from one is a port on Platform.',
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        'apps/server/src/**/*.ts',
        'apps/requests/src/**/*.ts',
        'packages/database/src/**/*.ts',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [...SHARED_IMPORT_BANS, ...DIALECT_IMPORT_BANS] },
        ],
      },
    },
    {
      files: ['apps/server/src/**/*.ts', 'apps/requests/src/**/*.ts'],
      rules: { 'valence/neutral-queries': 'error' },
    },
    {
      files: [...DIALECT_FOLDERS, ...DATABASE_TESTS],
      rules: {
        'no-restricted-imports': ['error', { patterns: [...SHARED_IMPORT_BANS] }],
        'valence/neutral-queries': 'off',
      },
    },
    {
      files: TESTS,
      rules: {
        'valence/no-raw-colours': 'off',
        'valence/no-hard-coded-strings': 'off',
        'typescript/no-unnecessary-condition': 'off',
        'valence/banned-syntax': ['error', ...TYPE_BANS],
      },
    },
    {
      files: ['**/*.config.ts', '**/*.config.mts', '**/vitest.setup.ts'],
      rules: {
        'import/no-default-export': 'off',
        ...Object.fromEntries(TYPE_AWARE_RULES.map((rule) => [rule, 'off'])),
      },
    },
  ],
});
