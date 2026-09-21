import { describe, expect, it } from 'vitest';
import { searchDocs } from '@ValenceDocs/content/searchDocs';

const entries = [
  { path: '/a', title: 'Reverse proxy', sectionTitle: 'Install', text: 'Put nginx in front.' },
  { path: '/b', title: 'Storage', sectionTitle: 'Install', text: 'A reverse proxy is not needed.' },
  { path: '/c', title: 'Jobs', sectionTitle: 'Use', text: 'Runs in the background.' },
];

describe('searchDocs', () => {
  it('finds nothing for an empty query', () => {
    expect(searchDocs(entries, '   ')).toEqual([]);
  });

  it('requires every word', () => {
    expect(searchDocs(entries, 'proxy jobs')).toEqual([]);
  });

  it('puts a title match above a body match', () => {
    expect(searchDocs(entries, 'reverse proxy').map((result) => result.path)).toEqual(['/a', '/b']);
  });

  it('quotes the passage that matched', () => {
    expect(searchDocs(entries, 'background')[0]?.snippet).toContain('Runs in the background');
  });

  it('limits how many it returns', () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      path: `/${index.toString()}`,
      title: 'Same',
      sectionTitle: 'S',
      text: 'same',
    }));

    expect(searchDocs(many, 'same')).toHaveLength(8);
  });
});
