import { describe, expect, it } from 'vitest';
import { applyFilters } from './applyFilters';
import type { CardigannFilter } from './CardigannDefinitionSchema';

const CONTEXT = {
  variables: { '.Config.sitelink': 'https://tracker.example/', '.Result._id': '42' },
  encoding: 'UTF-8',
  nowMs: Date.parse('2026-09-19T12:00:00.000Z'),
};

/**
 * Applies one filter by name.
 */
const filter = (text: string, name: string, args: CardigannFilter['args'] = null) =>
  applyFilters(text, [{ name, args }], CONTEXT);

describe('applyFilters', () => {
  it('reads an argument from a query string, with or without the address', () => {
    expect(filter('browse.php?cat=123&x=1#top', 'querystring', 'cat')).toBe('123');
    expect(filter('cat=5', 'querystring', 'cat')).toBe('5');
    expect(filter('browse.php?x=1', 'querystring', 'cat')).toBe('');
  });

  it('reads dates by layout, by age and by guessing, as ISO 8601', () => {
    expect(filter('2024-03-05 14:30:00 +03:00', 'dateparse', 'yyyy-MM-dd HH:mm:ss zzz')).toBe(
      '2024-03-05T11:30:00.000Z',
    );
    expect(filter('2 hours ago', 'timeago')).toBe('2026-09-19T10:00:00.000Z');
    expect(filter('5 minutes', 'reltime')).toBe('2026-09-19T11:55:00.000Z');
    expect(filter('Yesterday', 'fuzzytime')).toBe('2026-09-18T00:00:00.000Z');
    expect(filter('03/05/2024', 'fuzzytime', 'UK')).toBe('2024-05-03T00:00:00.000Z');
  });

  it('leaves a date it cannot read as it was', () => {
    expect(filter('whenever', 'dateparse', 'yyyy')).toBe('whenever');
  });

  it('extracts the first group of a pattern, or nothing', () => {
    expect(filter('Uploaded 09-14 02:31, Size 282.88 MiB', 'regexp', 'Uploaded (.+?),')).toBe(
      '09-14 02:31',
    );
    expect(filter('nothing here', 'regexp', '(\\d+)')).toBe('');
  });

  it('replaces by pattern, filling templates in the replacement', () => {
    expect(filter('12x45', 're_replace', ['(\\d{2})x(\\d{2})', 'S$1E$2'])).toBe('S12E45');
    expect(filter('ID', 're_replace', ['ID', '{{ .Result._id }}'])).toBe('42');
    expect(
      filter('Science Fiction', 're_replace', ['(?i)(science fiction)', 'Science_Fiction']),
    ).toBe('Science_Fiction');
  });

  it('leaves the value alone where a pattern cannot run', () => {
    expect(filter('keep', 're_replace', ['((?<-o>)', 'x'])).toBe('keep');
  });

  it('splits and picks a part, counting from the end where negative', () => {
    expect(filter('sub/45/0', 'split', ['/', '1'])).toBe('45');
    expect(filter('a.b.c', 'split', ['.', '-1'])).toBe('c');
    expect(filter('a.b', 'split', ['.', '5'])).toBe('');
  });

  it('replaces text, filling templates in the replacement', () => {
    expect(filter('Y-day 12:27', 'replace', ['Y-day', 'yesterday'])).toBe('yesterday 12:27');
    expect(filter('/details/', 'replace', ['/details/', '{{ .Config.sitelink }}d/'])).toBe(
      'https://tracker.example/d/',
    );
  });

  it('trims whitespace, or the characters given', () => {
    expect(filter('  title  ', 'trim')).toBe('title');
    expect(filter('xxtitlexx', 'trim', 'x')).toBe('title');
    expect(filter('-]title]-', 'trim', ']-')).toBe('title');
  });

  it('prepends and appends, filling templates in', () => {
    expect(filter('ABC', 'prepend', 'magnet:?xt=urn:btih:')).toBe('magnet:?xt=urn:btih:ABC');
    expect(filter('2024-03-05', 'append', ' +03:00')).toBe('2024-03-05 +03:00');
    expect(filter('t/', 'prepend', '{{ .Config.sitelink }}')).toBe('https://tracker.example/t/');
  });

  it('changes case', () => {
    expect(filter('Mixed', 'tolower')).toBe('mixed');
    expect(filter('Mixed', 'toupper')).toBe('MIXED');
  });

  it('encodes and decodes for URLs and HTML', () => {
    expect(filter('a b', 'urlencode')).toBe('a+b');
    expect(filter('a+b%21', 'urldecode')).toBe('a b!');
    expect(filter('Anne Rice&#039;s &amp; co', 'htmldecode')).toBe("Anne Rice's & co");
    expect(filter('<b>', 'htmlencode')).toBe('&lt;b&gt;');
  });

  it('makes a valid file name', () => {
    expect(filter('aFile?Name>With<Invalid*Symbols', 'validfilename')).toBe(
      'aFileNameWithInvalidSymbols',
    );
  });

  it('replaces diacritics with their base characters, and only when asked to', () => {
    expect(filter('ŠĆŽšćž', 'diacritics', 'replace')).toBe('SCZscz');
    expect(filter('Š', 'diacritics', 'keep')).toBe('Š');
  });

  it('joins a JSON array', () => {
    expect(
      filter('{"result":["<tr>","<td>1</td>",{"x":1}]}', 'jsonjoinarray', ['$.result', '']),
    ).toBe('<tr><td>1</td>{"x":1}');
    expect(filter('{"result":"not a list"}', 'jsonjoinarray', ['$.result', ''])).toBe('');
    expect(filter('not json', 'jsonjoinarray', ['$.result', ''])).toBe('not json');
  });

  it('keeps only the words allowed', () => {
    expect(
      filter(
        'crime, x264, 1080p, (music), comedy, Science_Fiction, dd5.1',
        'validate',
        'Action, Crime, Comedy, Science_Fiction',
      ),
    ).toBe('crime, comedy, science fiction');
  });

  it('does nothing for a filter it does not know', () => {
    expect(filter('same', 'strdump', 'title')).toBe('same');
  });

  it('applies filters in turn', () => {
    expect(
      applyFilters(
        ' 12x45 ',
        [
          { name: 'trim', args: null },
          { name: 're_replace', args: ['(\\d{2})x(\\d{2})', 'S$1E$2'] },
          { name: 'tolower', args: null },
        ],
        CONTEXT,
      ),
    ).toBe('s12e45');
  });
});
