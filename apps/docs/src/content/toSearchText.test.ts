import { describe, expect, it } from 'vitest';
import { toSearchText } from '@ValenceDocs/content/toSearchText';

describe('toSearchText', () => {
  it('drops the frontmatter', () => {
    expect(toSearchText('---\ntitle: X\n---\nHello')).toBe('Hello');
  });

  it('keeps the words of a link and an image and drops their targets', () => {
    expect(toSearchText('See [the guide](/x) and ![a screen](/y.png).')).toBe(
      'See the guide and a screen.',
    );
  });

  it('drops markup characters and tags', () => {
    expect(toSearchText('## A `thing`\n<Callout title="T">Body</Callout>')).toBe('A thing Body');
  });
});
