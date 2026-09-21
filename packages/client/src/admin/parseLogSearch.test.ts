import { describe, expect, it } from 'vitest';
import { parseLogSearch } from './parseLogSearch';

describe('parseLogSearch', () => {
  it('has nothing to narrow by, and no text, for an empty box', () => {
    expect(parseLogSearch('')).toStrictEqual({
      levels: [],
      sources: [],
      jobKinds: [],
      ids: {},
      text: '',
    });
  });

  it('leaves plain words as text to look for', () => {
    expect(parseLogSearch('could not read').text).toBe('could not read');
  });

  it('reads a level, and does not mind its capitals', () => {
    expect(parseLogSearch('level:ERROR level:warn').levels).toStrictEqual(['error', 'warn']);
  });

  it('reads a source', () => {
    expect(parseLogSearch('source:jobs').sources).toStrictEqual(['jobs']);
  });

  it('reads a kind of job, which is any text', () => {
    expect(parseLogSearch('kind:library.scan').jobKinds).toStrictEqual(['library.scan']);
  });

  it.each([
    ['job', 'jobId'],
    ['library', 'libraryId'],
    ['media', 'mediaId'],
    ['session', 'sessionId'],
    ['request', 'requestId'],
  ])('reads %s: as the %s to match exactly', (key, field) => {
    expect(parseLogSearch(`${key}:abc-123`).ids).toStrictEqual({ [field]: 'abc-123' });
  });

  it('takes a quoted value whole, spaces and all', () => {
    expect(parseLogSearch('kind:"library scan" tail').jobKinds).toStrictEqual(['library scan']);
    expect(parseLogSearch('kind:"library scan" tail').text).toBe('tail');
  });

  it('mixes fields and text, keeping the text in the order it was typed', () => {
    const parsed = parseLogSearch('unreadable level:error file source:scanner');

    expect(parsed).toMatchObject({
      levels: ['error'],
      sources: ['scanner'],
      text: 'unreadable file',
    });
  });

  it('leaves a field it does not know as text rather than losing it', () => {
    expect(parseLogSearch('colour:red').text).toBe('colour:red');
    expect(parseLogSearch('constructor:x').text).toBe('constructor:x');
  });

  it('leaves a value the field cannot hold as text', () => {
    expect(parseLogSearch('level:catastrophe').text).toBe('level:catastrophe');
    expect(parseLogSearch('source:mars').levels).toStrictEqual([]);
  });

  it('leaves a field with no value as text, and a bare colon or address alone', () => {
    expect(parseLogSearch('job:').text).toBe('job:');
    expect(parseLogSearch(':80').text).toBe(':80');
  });
});
