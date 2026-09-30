import { describe, expect, it } from 'vitest';
import { englishModuleOf } from './englishModuleOf';

describe('englishModuleOf', () => {
  it('writes the words as the one constant the module exports', () => {
    expect(englishModuleOf({ 'common.cancel': 'Cancel', 'error.quote': 'It said "no"' })).toBe(
      'const ENGLISH = {"common.cancel":"Cancel","error.quote":"It said \\"no\\""};\n\nexport { ENGLISH };\n',
    );
  });
});
