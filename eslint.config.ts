import tseslint from 'typescript-eslint';
import { noComments } from './tools/eslint/noComments';
import { noRawColours } from './tools/eslint/noRawColours';

const valence = {
  rules: {
    'no-comments': noComments,
    'no-raw-colours': noRawColours,
  },
};

const PARENT_IMPORT_BAN = {
  group: ['../*'],
  message:
    'Parent-relative imports are banned. Use @ValenceUI/*, @ValenceCore/*, @ValenceContracts/* or @ValenceSDK/*.',
};

const HUGEICONS_RENDERER_BAN = {
  group: ['@hugeicons/react'],
  message:
    'Draw an icon with @ValenceUI/Icon rather than HugeiconsIcon, so the set stays swappable in one file.',
};

const SHARED_IMPORT_BANS = [
  PARENT_IMPORT_BAN,
  {
    group: ['@tabler/icons-react', '@remixicon/react', 'lucide-react', '@phosphor-icons/*'],
    message:
      'Icons come from @hugeicons/core-free-icons, drawn by @ValenceUI/Icon — see code standards section 10.',
  },
  HUGEICONS_RENDERER_BAN,
];

const LANDING_IMPORT_BANS = [
  PARENT_IMPORT_BAN,
  {
    group: ['@remixicon/react', 'lucide-react', '@phosphor-icons/*'],
    message:
      'getvalence.app draws its icons from @tabler/icons-react — see code standards section 10 for why the product itself uses @hugeicons/core-free-icons instead.',
  },
  HUGEICONS_RENDERER_BAN,
];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-main/**',
      '**/dist-preload/**',
      '**/coverage/**',
      '**/node_modules/**',
      'target/**',
      '**/.turbo/**',
      '**/.astro/**',
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { valence },
    rules: {
      'valence/no-comments': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [...SHARED_IMPORT_BANS],
        },
      ],
      'no-restricted-syntax': [
        'error',
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
          message:
            'Type assertions are banned. Parse untrusted input through a Zod schema instead.',
        },
        {
          selector:
            'JSXOpeningElement[name.name="Icon"] > JSXAttribute[name.name="className"] > Literal[value=/\\btext-(text|text-muted|danger)\\b/]',
          message:
            'An icon is given its colour by tone, not by className. Use tone="muted" or tone="danger" — see code standards section 10.',
        },
        {
          selector:
            'JSXOpeningElement[name.name="Button"] > JSXAttribute[name.name="className"] > Literal[value=/\\bhover:text-text\\b/]',
          message:
            'A button that is muted until it is pointed at is variant="subtle", not a look in className — see code standards section 9.',
        },
      ],
    },
  },
  {
    files: [
      'packages/ui/src/**/*.tsx',
      'packages/screens/src/**/*.tsx',
      'apps/web/src/**/*.tsx',
      'apps/landing/src/**/*.tsx',
    ],
    rules: {
      'valence/no-raw-colours': 'error',
    },
  },
  {
    files: ['apps/landing/src/**/*.ts', 'apps/landing/src/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...LANDING_IMPORT_BANS],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'valence/no-raw-colours': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSUnknownKeyword',
          message: 'unknown is banned. Parse untrusted input through a Zod schema instead.',
        },
        {
          selector: 'TSAsExpression[typeAnnotation.typeName.name!="const"]',
          message:
            'Type assertions are banned. Parse untrusted input through a Zod schema instead.',
        },
      ],
    },
  },
  {
    files: [
      'packages/ui/src/components/Button/Button.tsx',
      'packages/ui/src/components/TextField/TextField.tsx',
      'packages/ui/src/components/FilePicker/FilePicker.tsx',
      'packages/ui/src/components/EmbeddedVideo/EmbeddedVideo.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSUnknownKeyword',
          message: 'unknown is banned. Parse untrusted input through a Zod schema instead.',
        },
        {
          selector: 'TSAsExpression[typeAnnotation.typeName.name!="const"]',
          message:
            'Type assertions are banned. Parse untrusted input through a Zod schema instead.',
        },
      ],
    },
  },
  {
    files: ['packages/ui/src/components/Icon/Icon.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
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
    files: ['**/*.config.ts', '**/vitest.setup.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
);
