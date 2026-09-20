import { describe, expect, it } from 'vitest';
import { isSecretSetting } from './isSecretSetting';

describe('isSecretSetting', () => {
  it.each([
    ['password', 'password', true],
    ['apikey', 'text', true],
    ['cookie', 'text', true],
    ['rsskey', 'text', true],
    ['passkey', 'text', true],
    ['username', 'text', false],
    ['freeleech', 'checkbox', false],
    ['sort_key', 'select', false],
  ])('says %s (%s) is secret: %s', (name, type, isSecret) => {
    expect(isSecretSetting({ name, type })).toBe(isSecret);
  });
});
