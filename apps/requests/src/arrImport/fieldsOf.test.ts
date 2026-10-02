import { describe, expect, it } from 'vitest';
import { fieldsOf } from './fieldsOf';

const FIELDS = [
  { name: 'host', value: ' qbittorrent ' },
  { name: 'port', value: 8080 },
  { name: 'portAsText', value: '9091' },
  { name: 'useSsl', value: true },
  { name: 'categories', value: [2000, 'x', 2040] },
  { name: 'urlBase' },
];

describe('fieldsOf', () => {
  it('reads each field by name in the shape wanted', () => {
    const read = fieldsOf(FIELDS);

    expect(read.text('host')).toBe('qbittorrent');
    expect(read.text('port')).toBe('8080');
    expect(read.number('port')).toBe(8080);
    expect(read.number('portAsText')).toBe(9091);
    expect(read.flag('useSsl')).toBe(true);
    expect(read.numbers('categories')).toEqual([2000, 2040]);
  });

  it('reads a field it lacks, or one without a value, as empty', () => {
    const read = fieldsOf(FIELDS);

    expect(read.text('urlBase')).toBe('');
    expect(read.number('missing')).toBeNull();
    expect(read.flag('missing')).toBe(false);
    expect(read.numbers('host')).toEqual([]);
  });
});
