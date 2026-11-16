import { describe, expect, it } from 'vitest';
import { refusedByPolicy } from './refusedByPolicy';

const aRefusal = (blockedURI: string): Event =>
  Object.assign(new Event('securitypolicyviolation'), { blockedURI });

describe('refusedByPolicy', () => {
  it('collects the origin of every request the page’s policy refused', () => {
    refusedByPolicy();

    document.dispatchEvent(aRefusal('https://films.example/api/federation/v1/direct/t/file'));

    expect(refusedByPolicy().has('https://films.example')).toBe(true);
  });

  it('ignores a refusal of something with no address, such as inline script', () => {
    refusedByPolicy();

    document.dispatchEvent(aRefusal('inline'));

    expect([...refusedByPolicy()]).not.toContain('inline');
  });
});
