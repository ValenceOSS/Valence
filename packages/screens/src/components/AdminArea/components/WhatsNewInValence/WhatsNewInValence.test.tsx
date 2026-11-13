import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { saveChangelogSeen, readChangelogSeen } from '@ValenceScreens/admin/changelogSeen';
import type { UpdateCheck } from '@ValenceContracts/schemas/UpdateCheck';
import { WhatsNewInValence } from './WhatsNewInValence';

const check = (overrides: Partial<UpdateCheck> = {}): UpdateCheck => ({
  current: '1.9.0',
  latest: '1.9.0',
  isNewer: false,
  publishedAt: null,
  notes:
    '## What’s Changed\n* feat(screens): a deck of cards for a logo\n* fix: the admin page loads every time',
  url: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.9.0',
  history: [],
  checkedAt: null,
  isEnabled: true,
  problem: null,
  dev: null,
  ...overrides,
});

const draw = (answer: UpdateCheck, onOpenUpdates = vi.fn()) => {
  const answers = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

  answers.setQueryData(adminQueries.updateCheck().queryKey, answer);
  render(
    <QueryClientProvider client={answers}>
      <WhatsNewInValence onOpenUpdates={onOpenUpdates} />
    </QueryClientProvider>,
  );

  return onOpenUpdates;
};

describe('WhatsNewInValence', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('says what changed once a device opens a release it has not seen', () => {
    saveChangelogSeen('1.8.0');
    draw(check());

    expect(screen.getByText('What’s new in Valence 1.9.0')).toBeInTheDocument();
    expect(screen.getByText(/deck of cards for a logo/i)).toBeInTheDocument();
  });

  it('says nothing on a device opening Valence for the first time, and remembers the release', () => {
    draw(check());

    expect(screen.queryByText('What’s new in Valence 1.9.0')).not.toBeInTheDocument();
    expect(readChangelogSeen()).toBe('1.9.0');
  });

  it('says nothing for a nightly build', () => {
    saveChangelogSeen('1.8.0');
    draw(check({ current: '1.9.0-nightly.20261113' }));

    expect(screen.queryByText(/What’s new in Valence/)).not.toBeInTheDocument();
  });

  it('opens the full notes and remembers it has been seen', () => {
    saveChangelogSeen('1.8.0');

    const onOpenUpdates = draw(check());

    fireEvent.click(screen.getByRole('button', { name: 'See everything new' }));

    expect(onOpenUpdates).toHaveBeenCalledOnce();
    expect(readChangelogSeen()).toBe('1.9.0');
  });
});
