type AiReadablePage = {
  path: string;
  sectionTitle: string;
  title: string;
  description: string;
  source: string;
};

const FRONTMATTER = /^---\n[\s\S]*?\n---\n?/u;

const CALLOUT_TITLE = /title="(?<title>[^"]+)"/u;

const codeFenceOf = (line: string): '```' | '~~~' | null => {
  const trimmed = line.trimStart();

  if (trimmed.startsWith('```')) {
    return '```';
  }

  if (trimmed.startsWith('~~~')) {
    return '~~~';
  }

  return null;
};

const cleanOutsideCode = (source: string, clean: (chunk: string) => string): string => {
  const lines = source.split('\n');
  const cleaned: string[] = [];
  let held: string[] = [];
  let fence: '```' | '~~~' | null = null;

  for (const line of lines) {
    const found = codeFenceOf(line);

    if (fence === null && found !== null) {
      cleaned.push(clean(held.join('\n')));
      held = [line];
      fence = found;
      continue;
    }

    if (fence !== null) {
      held.push(line);

      if (found === fence) {
        cleaned.push(held.join('\n'));
        held = [];
        fence = null;
      }

      continue;
    }

    held.push(line);
  }

  if (held.length > 0) {
    cleaned.push(fence === null ? clean(held.join('\n')) : held.join('\n'));
  }

  return cleaned.join('\n');
};

const dropMdxOnlySyntax = (source: string): string =>
  cleanOutsideCode(source.replace(FRONTMATTER, ''), (chunk) =>
    chunk
      .replace(/<Callout\b(?<attributes>[^>]*)>/gu, (_match, attributes: string) => {
        const title = CALLOUT_TITLE.exec(attributes)?.groups?.title;

        return title === undefined ? '' : `**${title}**\n`;
      })
      .replace(/<\/Callout>/gu, '')
      .replace(/<\/?[A-Z][A-Za-z0-9]*(?:\s[^>]*)?>/gu, '')
      .trim(),
  )
    .replace(/\n{3,}/gu, '\n\n')
    .trim();

const markdownPathOf = (page: Pick<AiReadablePage, 'path'>): string => `${page.path}.md`;

const markdownOf = (page: AiReadablePage): string =>
  `# ${page.title}\n\n> ${page.description}\n\n${dropMdxOnlySyntax(page.source)}\n`;

const linkTitle = (title: string): string => title.replace(/\]/gu, '\\]');

const oneLine = (text: string): string => text.replace(/\s+/gu, ' ').trim();

const llmsTxtOf = (pages: readonly AiReadablePage[]): string => {
  const sections = [...new Set(pages.map((page) => page.sectionTitle))];

  return [
    '# Valence documentation',
    '',
    '> Documentation for Valence, a self-hosted streaming platform for films, programmes, music, books and audiobooks.',
    '',
    'Use these Markdown files when you need install guides, product behaviour, plugin documentation, developer notes or API reference material. A complete single-file version is available at `/llms-full.txt`.',
    '',
    ...sections.flatMap((section) => [
      `## ${section}`,
      '',
      ...pages
        .filter((page) => page.sectionTitle === section)
        .map(
          (page) =>
            `- [${linkTitle(page.title)}](${markdownPathOf(page)}): ${oneLine(page.description)}`,
        ),
      '',
    ]),
  ].join('\n');
};

const llmsFullTxtOf = (pages: readonly AiReadablePage[]): string =>
  [
    '# Valence documentation',
    '',
    '> Documentation for Valence, a self-hosted streaming platform for films, programmes, music, books and audiobooks.',
    '',
    ...pages.flatMap((page) => [
      `# ${page.title}`,
      '',
      `Source: ${page.path}`,
      `Markdown: ${markdownPathOf(page)}`,
      '',
      `> ${page.description}`,
      '',
      dropMdxOnlySyntax(page.source),
      '',
      '---',
      '',
    ]),
  ].join('\n');

export type { AiReadablePage };

export { dropMdxOnlySyntax, llmsFullTxtOf, llmsTxtOf, markdownOf, markdownPathOf };
