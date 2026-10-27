import { describe, expect, it } from 'vitest';
import { LinkHostSchema } from './LinkHostSchema';

describe('LinkHostSchema', () => {
  it.each(['files.example.com', '*.files.example.com', '*.example.com'])('accepts %s', (host) => {
    expect(LinkHostSchema.safeParse(host).success).toBe(true);
  });

  it.each([
    '*.com',
    '*',
    '*.*.example.com',
    'files.*.example.com',
    '*example.com',
    'https://files.example.com',
    '*.Example.com',
    'files.example.com:443',
    '*.0.1',
    '10.0.0.5',
  ])('refuses %s', (host) => {
    expect(LinkHostSchema.safeParse(host).success).toBe(false);
  });
});
