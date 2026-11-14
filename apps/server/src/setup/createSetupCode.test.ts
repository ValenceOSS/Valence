import { describe, expect, it } from 'vitest';
import { createSetupCode } from './createSetupCode';

describe('createSetupCode', () => {
  it('writes a code in groups nobody could misread', () => {
    expect(createSetupCode().code).toMatch(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){3}$/u);
  });

  it('makes a different code every time', () => {
    expect(createSetupCode().code).not.toBe(createSetupCode().code);
  });

  it('takes the code back however it was typed', () => {
    const setup = createSetupCode();

    expect(setup.matches(setup.code)).toBe(true);
    expect(setup.matches(setup.code.toLowerCase())).toBe(true);
    expect(setup.matches(setup.code.replaceAll('-', ' '))).toBe(true);
    expect(setup.matches(` ${setup.code.replaceAll('-', '')} `)).toBe(true);
  });

  it('refuses anything else', () => {
    const setup = createSetupCode();

    expect(setup.matches('')).toBe(false);
    expect(setup.matches(createSetupCode().code)).toBe(false);
    expect(setup.matches(setup.code.slice(0, -1))).toBe(false);
  });
});
