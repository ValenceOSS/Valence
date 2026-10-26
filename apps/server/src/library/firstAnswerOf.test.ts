import { describe, expect, it, vi } from 'vitest';
import { firstAnswerOf } from './firstAnswerOf';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';

type Provider = { name: string; find?: () => Promise<string | null> };

const asking = (providers: Provider[], onProblem = vi.fn()) =>
  troubleWatch.during(() => firstAnswerOf(providers, (provider) => provider.find?.(), onProblem));

const failing: Provider = {
  name: 'a plugin',
  find: () => Promise.reject(new Error('it fell over')),
};

describe('firstAnswerOf', () => {
  it('takes the first provider that knows, skipping those that cannot be asked', async () => {
    await expect(
      asking([
        { name: 'unaskable' },
        { name: 'ignorant', find: () => Promise.resolve(null) },
        { name: 'knowing', find: () => Promise.resolve('an answer') },
      ]),
    ).resolves.toEqual({ value: 'an answer', trouble: null });
  });

  it('keeps a provider that failed quiet where a later one answered', async () => {
    const onProblem = vi.fn();

    await expect(
      asking([failing, { name: 'catalogue', find: () => Promise.resolve('an answer') }], onProblem),
    ).resolves.toEqual({ value: 'an answer', trouble: null });
    expect(onProblem).toHaveBeenCalledWith('a plugin', expect.anything());
  });

  it('keeps a site a provider could not ask quiet where a later one answered', async () => {
    const keyless: Provider = {
      name: 'catalogue',
      find: () => {
        troubleWatch.report({ source: 'TMDB', reason: 'keyMissing' });

        return Promise.resolve(null);
      },
    };

    await expect(
      asking([keyless, { name: 'a plugin', find: () => Promise.resolve('an answer') }]),
    ).resolves.toEqual({ value: 'an answer', trouble: null });
  });

  it('says what went wrong where nobody answered', async () => {
    await expect(
      asking([failing, { name: 'ignorant', find: () => Promise.resolve(null) }]),
    ).resolves.toEqual({ value: null, trouble: { source: 'a plugin', reason: 'faulty' } });
  });
});
