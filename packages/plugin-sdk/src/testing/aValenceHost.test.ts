import { describe, expect, it } from 'vitest';
import { aValenceHost } from './aValenceHost';

describe('a stand-in for the host', () => {
  it('uses the parts a test supplies', async () => {
    const host = aValenceHost({ settings: { read: () => Promise.resolve({ apiKey: 'k' }) } });

    expect(await host.settings.read()).toEqual({ apiKey: 'k' });
  });

  it('refuses the parts a test does not supply', async () => {
    await expect(aValenceHost().storage.get('x')).rejects.toThrow('does not supply');
  });
});
