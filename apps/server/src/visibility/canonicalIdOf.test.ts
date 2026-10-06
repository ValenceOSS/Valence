import { describe, expect, it } from 'vitest';
import { canonicalIdOf } from './canonicalIdOf';

const ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('canonicalIdOf', () => {
  it.each([
    ['the usual spelling', ID],
    ['no hyphens at all', '3f2504e04f8941d39a0c0305e82c3301'],
    ['braces around it', `{${ID}}`],
    ['capitals', ID.toUpperCase()],
    ['hyphens every four digits', '3f25-04e0-4f89-41d3-9a0c-0305-e82c-3301'],
  ])('reads %s as the identifier', (_what, segment) => {
    expect(canonicalIdOf(segment)).toBe(ID);
  });

  it.each([
    ['a word', 'trickplay'],
    ['a word made only of hex letters', 'added'],
    ['one digit short', ID.slice(0, -1)],
    ['one digit over', `${ID}0`],
    ['two hyphens together', '3f2504e0--4f89-41d3-9a0c-0305e82c3301'],
    ['a hyphen at the start', `-${ID}`],
    ['nothing', ''],
  ])('reads %s as no identifier', (_what, segment) => {
    expect(canonicalIdOf(segment)).toBeNull();
  });
});
