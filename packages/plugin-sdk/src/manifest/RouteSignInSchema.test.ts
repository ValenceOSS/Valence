import { describe, expect, it } from 'vitest';
import { RouteSignInSchema } from './RouteSignInSchema';

describe('RouteSignInSchema', () => {
  it('reads each way a request can say who it is', () => {
    const kinds = [
      { kind: 'public' },
      { kind: 'bearer' },
      { kind: 'basic' },
      { kind: 'query', secret: 'apiKey' },
      { kind: 'query', login: 'u', secret: 'p', hexPrefix: 'enc:' },
      { kind: 'saltedMd5', login: 'u', token: 't', salt: 's' },
    ].map((signIn) => RouteSignInSchema.parse(signIn).kind);

    expect(kinds).toEqual(['public', 'bearer', 'basic', 'query', 'query', 'saltedMd5']);
  });

  it('refuses a parameter name that is not a plain word, and anything it does not know', () => {
    expect(RouteSignInSchema.safeParse({ kind: 'query', secret: 'a b' }).success).toBe(false);
    expect(RouteSignInSchema.safeParse({ kind: 'query', secret: '' }).success).toBe(false);
    expect(RouteSignInSchema.safeParse({ kind: 'cookie' }).success).toBe(false);
    expect(RouteSignInSchema.safeParse({ kind: 'bearer', header: 'x' }).success).toBe(false);
  });
});
