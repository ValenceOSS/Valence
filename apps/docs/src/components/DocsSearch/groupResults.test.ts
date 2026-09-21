import { describe, expect, it } from 'vitest';
import { groupResults } from '@ValenceDocs/components/DocsSearch/groupResults';

const result = (path: string, sectionTitle: string) => ({
  path,
  title: path,
  sectionTitle,
  detail: 'about it',
});

describe('groupResults', () => {
  it('gathers results under their section in the order the sections first appear', () => {
    const groups = groupResults([
      result('/use/a', 'Use Valence'),
      result('/install/b', 'Install'),
      result('/use/c', 'Use Valence'),
    ]);

    expect(groups.map((group) => group.heading)).toEqual(['Use Valence', 'Install']);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['/use/a', '/use/c']);
  });

  it('has no groups for no results', () => {
    expect(groupResults([])).toEqual([]);
  });
});
