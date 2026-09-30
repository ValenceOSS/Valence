import { describe, expect, it } from 'vitest';
import { sayVerbatim } from './sayVerbatim';

describe('sayVerbatim', () => {
  it('passes words on as they came, with no code to translate them by', () => {
    expect(sayVerbatim('disk full')).toEqual({ code: null, message: 'disk full', values: {} });
  });
});
