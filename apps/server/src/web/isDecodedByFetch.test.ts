import { describe, expect, it } from 'vitest';
import { isDecodedByFetch } from './isDecodedByFetch';

describe('isDecodedByFetch', () => {
  it('says so for every coding fetch undoes, alone or together, in any case', () => {
    expect(isDecodedByFetch('gzip')).toBe(true);
    expect(isDecodedByFetch('X-Gzip')).toBe(true);
    expect(isDecodedByFetch('br')).toBe(true);
    expect(isDecodedByFetch('zstd')).toBe(true);
    expect(isDecodedByFetch('deflate, gzip')).toBe(true);
  });

  it('says not where there is no coding', () => {
    expect(isDecodedByFetch(null)).toBe(false);
    expect(isDecodedByFetch('')).toBe(false);
    expect(isDecodedByFetch(' , ')).toBe(false);
  });

  it('says not where one coding is unknown, since fetch then undoes none of them', () => {
    expect(isDecodedByFetch('identity')).toBe(false);
    expect(isDecodedByFetch('gzip, compress')).toBe(false);
  });

  it('says not past five codings, which fetch refuses', () => {
    expect(isDecodedByFetch('gzip, gzip, gzip, gzip, gzip')).toBe(true);
    expect(isDecodedByFetch('gzip, gzip, gzip, gzip, gzip, gzip')).toBe(false);
  });
});
