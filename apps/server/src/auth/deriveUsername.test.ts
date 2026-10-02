import { describe, expect, it } from 'vitest';
import { deriveUsername } from './deriveUsername';

const nobody = new Set<string>();

describe('deriveUsername', () => {
  it('takes the address before the @, in lower case', () => {
    expect(deriveUsername({ name: 'Pat', email: 'Pat.Smith@example.com' }, nobody)).toBe(
      'pat.smith',
    );
  });

  it('reads accents and other characters a username cannot hold', () => {
    expect(deriveUsername({ name: 'Pat', email: 'zoë+films@example.com' }, nobody)).toBe(
      'zoe.films',
    );
  });

  it('falls back on the name when the address is only a placeholder', () => {
    expect(deriveUsername({ name: 'Sam Jones', email: 'abc@no-email.invalid' }, nobody)).toBe(
      'sam.jones',
    );
  });

  it('falls back on a word of its own when neither holds anything usable', () => {
    expect(deriveUsername({ name: '★', email: 'x@no-email.invalid' }, nobody)).toBe('viewer');
  });

  it('numbers a username somebody already holds', () => {
    const taken = new Set(['pat', 'pat1']);

    expect(deriveUsername({ name: 'Pat', email: 'pat@example.com' }, taken)).toBe('pat2');
  });

  it('pads a username too short to be accepted', () => {
    expect(deriveUsername({ name: 'Jo', email: 'jo@example.com' }, nobody)).toBe('jo1');
    expect(deriveUsername({ name: 'J', email: 'j@example.com' }, nobody)).toBe('j01');
  });

  it('keeps a long username, numbered or not, within thirty characters', () => {
    const long = 'a'.repeat(40);
    const first = deriveUsername({ name: 'A', email: `${long}@example.com` }, nobody);

    expect(first).toHaveLength(30);
    expect(deriveUsername({ name: 'A', email: `${long}@example.com` }, new Set([first]))).toBe(
      `${'a'.repeat(29)}1`,
    );
  });
});
