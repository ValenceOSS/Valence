import { describe, expect, it } from 'vitest';
import { dropMdxOnlySyntax, llmsFullTxtOf, llmsTxtOf, markdownOf } from './aiReadableDocs';
import type { AiReadablePage } from './aiReadableDocs';

const page = (overrides: Partial<AiReadablePage> = {}): AiReadablePage => ({
  path: '/start/quick-start',
  sectionTitle: 'Getting started',
  title: 'Quick start',
  description: 'Install Valence with the compose file.',
  source: '---\ntitle: Quick start\ndescription: Install Valence.\norder: 1\n---\n\nHello.',
  ...overrides,
});

describe('dropMdxOnlySyntax', () => {
  it('drops frontmatter', () => {
    expect(dropMdxOnlySyntax('---\ntitle: X\n---\nHello')).toBe('Hello');
  });

  it('keeps callout titles as markdown and removes component tags', () => {
    expect(
      dropMdxOnlySyntax('<Callout title="Check this" tone="warning">\nRead it.\n</Callout>'),
    ).toBe('**Check this**\n\nRead it.');
  });

  it('does not rewrite code fences that contain jsx', () => {
    expect(dropMdxOnlySyntax('```tsx\nreturn <Button>Save</Button>;\n```')).toBe(
      '```tsx\nreturn <Button>Save</Button>;\n```',
    );
  });
});

describe('markdownOf', () => {
  it('builds a markdown page with the frontmatter title and description', () => {
    expect(markdownOf(page())).toBe(
      '# Quick start\n\n> Install Valence with the compose file.\n\nHello.\n',
    );
  });
});

describe('llmsTxtOf', () => {
  it('groups page markdown links by docs section', () => {
    expect(
      llmsTxtOf([
        page(),
        page({
          path: '/use/libraries',
          sectionTitle: 'Use Valence',
          title: 'Libraries',
          description: 'Add the folders Valence can read.',
        }),
      ]),
    ).toContain(
      '## Use Valence\n\n- [Libraries](/use/libraries.md): Add the folders Valence can read.',
    );
  });
});

describe('llmsFullTxtOf', () => {
  it('combines every page into one markdown file', () => {
    expect(llmsFullTxtOf([page()])).toContain(
      '# Quick start\n\nSource: /start/quick-start\nMarkdown: /start/quick-start.md',
    );
  });
});
