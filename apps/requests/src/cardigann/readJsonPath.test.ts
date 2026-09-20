import { describe, expect, it } from 'vitest';
import { readJsonPath } from './readJsonPath';

const DOCUMENT = {
  data: { torrents: [{ name: 'Dune' }, { name: 'Arrival' }], count: 2 },
  'odd key': true,
};

describe('readJsonPath', () => {
  it('follows names and indexes', () => {
    expect(readJsonPath(DOCUMENT, 'data.torrents[1].name')).toBe('Arrival');
    expect(readJsonPath(DOCUMENT, "$.data['count']")).toBe(2);
    expect(readJsonPath(DOCUMENT, '["odd key"]')).toBe(true);
  });

  it('returns the value itself for the root', () => {
    expect(readJsonPath(DOCUMENT, '$')).toBe(DOCUMENT);
    expect(readJsonPath(DOCUMENT, '')).toBe(DOCUMENT);
  });

  it('returns nothing for a path that leads nowhere', () => {
    expect(readJsonPath(DOCUMENT, 'data.missing')).toBeUndefined();
    expect(readJsonPath(DOCUMENT, 'data.count.deeper')).toBeUndefined();
    expect(readJsonPath(DOCUMENT, 'data.torrents.name')).toBeUndefined();
    expect(readJsonPath(DOCUMENT, 'data.torrents[9]')).toBeUndefined();
  });
});
