import { describe, expect, it } from 'vitest';
import { PhoneHandBackSchema } from './PhoneHandBack';

describe('PhoneHandBackSchema', () => {
  it('reads where the browser is sent', () => {
    expect(PhoneHandBackSchema.parse({ url: 'valence://signed-in?code=abc' }).url).toBe(
      'valence://signed-in?code=abc',
    );
  });

  it('refuses an answer with nowhere to go', () => {
    expect(PhoneHandBackSchema.safeParse({}).success).toBe(false);
  });
});
