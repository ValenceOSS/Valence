import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROBLEM_DOCS } from '@ValenceContracts/constants/PROBLEM_DOCS';
import { anchorsOf } from './anchorsOf';

describe('anchorsOf', () => {
  it('turns headings into the anchors the built page gives them', () => {
    expect(
      anchorsOf(
        [
          '## Who owns what it files',
          '### Indexers behind Cloudflare',
          "## What's `PUID`?",
          '## A VPN for the download client ##',
        ].join('\n'),
      ),
    ).toEqual(
      new Set([
        'who-owns-what-it-files',
        'indexers-behind-cloudflare',
        'whats-puid',
        'a-vpn-for-the-download-client',
      ]),
    );
  });

  it('numbers a heading that repeats one before it', () => {
    expect(anchorsOf('## Troubleshooting\n## Troubleshooting\n## Troubleshooting')).toEqual(
      new Set(['troubleshooting', 'troubleshooting-1', 'troubleshooting-2']),
    );
  });

  it('counts on past an anchor another heading already has', () => {
    expect(anchorsOf('## Troubleshooting\n## Troubleshooting-1\n## Troubleshooting')).toEqual(
      new Set(['troubleshooting', 'troubleshooting-1', 'troubleshooting-2']),
    );
  });

  it('leaves out what only looks like a heading inside code', () => {
    expect(anchorsOf('```sh\n# not a heading\n```\n## A heading')).toEqual(new Set(['a-heading']));
  });
});

describe('the docs every problem links to', () => {
  it('has the page and the heading each link names', () => {
    for (const [code, link] of Object.entries(PROBLEM_DOCS)) {
      const [path = '', anchor = ''] = link.split('#');
      const source = readFileSync(join(import.meta.dirname, `${path}.mdx`), 'utf8');

      expect(anchorsOf(source).has(anchor), `${code} links to ${link}`).toBe(true);
    }
  });
});
