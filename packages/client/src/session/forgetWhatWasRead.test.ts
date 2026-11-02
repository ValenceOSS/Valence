import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { forgetWhatWasRead } from './forgetWhatWasRead';

describe('forgetWhatWasRead', () => {
  it('throws away everything read for the person leaving', async () => {
    const cache = new QueryClient();

    cache.setQueryData(['progress', 'continue'], ['their film']);
    await forgetWhatWasRead(cache);

    expect(cache.getQueryCache().find({ queryKey: ['progress', 'continue'] })).toBeUndefined();
  });

  it('keeps the session asking, so whatever shows it hears nobody is signed in', async () => {
    const cache = new QueryClient();

    cache.setQueryData(['session', 'who'], { name: 'Dan' });
    await forgetWhatWasRead(cache);

    const who = cache.getQueryCache().find({ queryKey: ['session', 'who'] });

    expect(who).toBeDefined();
    expect(who?.state.data).toBeUndefined();
  });
});
