import { describe, expect, it } from 'vitest';
import { showKeyOf } from './showKeyOf';

describe('showKeyOf', () => {
  it('names a programme by its library and its own identifier', () => {
    expect(showKeyOf('lib', 'twin-peaks')).toBe('lib:twin-peaks');
  });
});
