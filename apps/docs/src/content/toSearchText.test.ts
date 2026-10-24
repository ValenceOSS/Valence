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

  it('keeps the underscores inside a name and drops the ones that mark emphasis', () => {
    expect(toSearchText('Set `VALENCE_DATA_DIR`, _not_ __the__ old one.')).toBe(
      'Set VALENCE_DATA_DIR , not the old one.',
    );
  });
});
