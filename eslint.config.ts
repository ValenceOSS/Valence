import tseslint from 'typescript-eslint';
import { noComments } from './tools/eslint/noComments';
import { noHardCodedStrings } from './tools/eslint/noHardCodedStrings';
import { noRawColours } from './tools/eslint/noRawColours';

const valence = {
  rules: {
    'no-comments': noComments,
    'no-hard-coded-strings': noHardCodedStrings,
    'no-raw-colours': noRawColours,
  },
};

const PARENT_IMPORT_BAN = {
  group: ['../*'],
  message:
    'Parent-relative imports are banned. Use @ValenceUI/*, @ValenceCore/*, @ValenceContracts/* or @ValenceSDK/*.',
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
      'packages/i18n/strings/**',
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
      'no-restricted-syntax': ['error', ...SYNTAX_BANS],
    },
  },
  {
    files: [
      'packages/ui/**/*.tsx',
      'packages/screens/**/*.tsx',
      'apps/web/**/*.tsx',
      'apps/desktop/**/*.tsx',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...SYNTAX_BANS, ANCHOR_BAN],
    },
  },
  {
    files: [
      'packages/ui/src/**/*.tsx',
      'packages/screens/src/**/*.tsx',
      'apps/web/src/**/*.tsx',
      'apps/landing/src/**/*.tsx',
      'apps/docs/src/**/*.tsx',
    ],
    rules: {
      'valence/no-raw-colours': 'error',
    },
  },
  {
    files: [
      'packages/ui/src/**/*.{ts,tsx}',
      'packages/screens/src/**/*.{ts,tsx}',
      'packages/client/src/**/*.{ts,tsx}',
      'packages/core/src/**/*.{ts,tsx}',
      'apps/web/src/**/*.{ts,tsx}',
      'apps/desktop/src/**/*.{ts,tsx}',
      'apps/mobile/src/**/*.{ts,tsx}',
      'apps/tv/src/**/*.{ts,tsx}',
      'apps/server/src/**/*.{ts,tsx}',
    ],
    rules: {
      'valence/no-hard-coded-strings': 'error',
    },
  },
  {
    files: [
      'apps/landing/src/**/*.ts',
      'apps/landing/src/**/*.tsx',
      'apps/docs/src/**/*.ts',
      'apps/docs/src/**/*.tsx',
    ],
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
      'valence/no-hard-coded-strings': 'off',
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
      'packages/ui/src/components/Link/Link.tsx',
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
