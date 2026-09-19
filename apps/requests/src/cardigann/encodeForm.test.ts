import { describe, expect, it } from 'vitest';
import { encodeForm } from './encodeForm';

describe('encodeForm', () => {
  it('encodes each pair, leaving ones already encoded alone', () => {
    expect(
      encodeForm(
        [
          { key: 'q', value: 'dune part two', isEncoded: false },
          { key: 'cat[]', value: '5', isEncoded: true },
          { key: 'name', value: 'Мир', isEncoded: false },
        ],
        'windows-1251',
      ),
    ).toBe('q=dune+part+two&cat[]=5&name=%CC%E8%F0');
  });

  it('writes nothing for no pairs', () => {
    expect(encodeForm([], 'UTF-8')).toBe('');
  });
});
