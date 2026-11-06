import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { SplashScreenWithBrand } from './SplashScreenWithBrand';

const branded = (logo: string | null) => {
  const cache = new QueryClient();

  cache.setQueryData(appearanceQueries.appearance().queryKey, {
    roundness: 'default',
    brand: { name: 'Home Cinema', accent: null, description: null, logo },
  });

  return cache;
};

describe('SplashScreenWithBrand', () => {
  it('holds back a name until it knows whose brand it is, rather than showing Valence first', () => {
    render(<SplashScreenWithBrand />, { wrapper: CacheScope });

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('Valence')).not.toBeInTheDocument();
  });

  it('is read out as loading Valence on a server with no brand of its own', () => {
    const cache = new QueryClient();

    cache.setQueryData(appearanceQueries.appearance().queryKey, {
      roundness: 'default',
      brand: { name: null, accent: null, description: null, logo: null },
    });

    render(
      <QueryClientProvider client={cache}>
        <SplashScreenWithBrand />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('status', { name: 'Loading Valence' })).toBeInTheDocument();
  });

  it('wears the server’s own name, where an administrator gave it one', () => {
    render(
      <QueryClientProvider client={branded(null)}>
        <SplashScreenWithBrand />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('status', { name: 'Loading Home Cinema' })).toBeInTheDocument();
    expect(screen.getByText('Home Cinema')).toBeInTheDocument();
  });

  it('holds up the server’s own logo', () => {
    const { container } = render(
      <QueryClientProvider client={branded('https://example.com/logo.png')}>
        <SplashScreenWithBrand />
      </QueryClientProvider>,
    );

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('says what it is waiting for, where that is more particular than the app', () => {
    render(<SplashScreenWithBrand label="Reading your library" />, { wrapper: CacheScope });

    expect(screen.getByRole('status', { name: 'Reading your library' })).toBeInTheDocument();
  });
});
