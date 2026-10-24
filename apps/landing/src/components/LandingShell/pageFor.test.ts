import { describe, expect, it } from 'vitest';
import { HomePage } from '@ValenceLanding/components/HomePage/HomePage';
import { PageProblem } from '@ValenceLanding/components/PageProblem/PageProblem';
import { pageFor } from './pageFor';

describe('pageFor', () => {
  it('finds the page for each kind of address', () => {
    expect(pageFor('/')).toBe(HomePage);
    expect(pageFor('/nowhere')).toBe(PageProblem);
    expect(pageFor('/changelog/one').displayName).toBe('ChangelogEntryPage');
    expect(pageFor('/ui/button')).toBe(pageFor('/ui'));
  });
});
