import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { lazyNamed } from './lazyNamed';

const Hello = () => <p>Hello</p>;

describe('lazyNamed', () => {
  it('draws the named component once its module has loaded', async () => {
    const Page = lazyNamed(() => Promise.resolve({ Hello }), 'Hello');

    render(
      <Suspense fallback={<p>Loading</p>}>
        <Page />
      </Suspense>,
    );

    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });

  it('draws on its first frame once preloaded, fetching its module only once', async () => {
    const load = vi.fn(() => Promise.resolve({ Hello }));
    const Page = lazyNamed(load, 'Hello');

    await Page.preload();
    render(
      <Suspense fallback={<p>Loading</p>}>
        <Page />
      </Suspense>,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('tries again after a fetch fails', async () => {
    const load = vi
      .fn<() => Promise<{ Hello: typeof Hello }>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ Hello });
    const Page = lazyNamed(load, 'Hello');

    await expect(Page.preload()).rejects.toThrow('offline');
    await expect(Page.preload()).resolves.toBe(Hello);
  });
});
