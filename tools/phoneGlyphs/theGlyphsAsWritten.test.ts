import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { theGlyphsAsWritten } from './theGlyphsAsWritten';

const WHERE = resolve(import.meta.dirname, '..', '..', 'apps', 'ios', 'src', 'glyphs');

describe('the phone’s glyphs', () => {
  it('are the ones the set draws today, rather than the ones it drew when they were written', () => {
    for (const [name, contents] of theGlyphsAsWritten()) {
      expect(readFileSync(join(WHERE, name), 'utf8')).toBe(contents);
    }
  });

  it('are each their own module, named for what they draw', () => {
    for (const [name] of theGlyphsAsWritten()) {
      expect(readFileSync(join(WHERE, name), 'utf8')).toContain(
        `export { ${name.replace('.tsx', '')} };`,
      );
    }
  });

  it('hold no markup, only shapes', () => {
    for (const [name] of theGlyphsAsWritten()) {
      expect(readFileSync(join(WHERE, name), 'utf8')).not.toContain('<svg');
    }
  });
});
