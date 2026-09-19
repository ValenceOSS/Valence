import { describe, expect, it } from 'vitest';
import { selectJson } from './selectJson';

const ROW = {
  name: 'Dune.2021.1080p.DTS',
  attributes: { size: 100, uploader: 'Ada', poster: 'x.jpg' },
};

describe('selectJson', () => {
  it('selects by path', () => {
    expect(selectJson(ROW, 'attributes.size')).toBe(100);
  });

  it('keeps what has, and drops what lacks, the path given', () => {
    expect(selectJson(ROW, ':has(attributes.size)')).toBe(ROW);
    expect(selectJson(ROW, ':has(attributes.missing)')).toBeUndefined();
  });

  it('drops what has the path given to not', () => {
    expect(selectJson(ROW, ':not(attributes.fake)')).toBe(ROW);
    expect(selectJson(ROW, ':not(attributes.size)')).toBeUndefined();
  });

  it('checks what the selection contains', () => {
    expect(selectJson(ROW, 'name:contains(DTS)')).toBe(ROW.name);
    expect(selectJson(ROW, 'name:contains("x265")')).toBeUndefined();
    expect(selectJson(ROW, 'attributes:contains(Ada)')).toBe(ROW.attributes);
  });

  it('nests conditions inside conditions', () => {
    expect(selectJson(ROW, 'name:not(:contains(DTS))')).toBeUndefined();
    expect(selectJson(ROW, 'name:not(:contains(x265))')).toBe(ROW.name);
    expect(
      selectJson(
        ROW,
        ':has(attributes.uploader:contains(Ada)):not(attributes.uploader:contains(Bob))',
      ),
    ).toBe(ROW);
  });

  it('selects nothing where the path leads nowhere', () => {
    expect(selectJson(ROW, 'missing:has(x)')).toBeUndefined();
  });

  it('stops reading conditions at anything it does not recognise', () => {
    expect(selectJson(ROW, 'name:contains(DTS):bogus')).toBe(ROW.name);
  });
});
