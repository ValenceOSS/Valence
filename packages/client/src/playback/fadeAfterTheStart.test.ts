import { describe, expect, it } from 'vitest';
import { fadeAfterTheStart } from './fadeAfterTheStart';

describe('fadeAfterTheStart', () => {
  it('starts from nothing', () => {
    expect(fadeAfterTheStart(0)).toBe(0);
  });

  it('rises over the first second', () => {
    expect(fadeAfterTheStart(0.5)).toBe(0.5);
  });

  it('is whole after that', () => {
    expect(fadeAfterTheStart(3)).toBe(1);
  });

  it('treats time before it began as nothing played', () => {
    expect(fadeAfterTheStart(-2)).toBe(0);
  });
});
