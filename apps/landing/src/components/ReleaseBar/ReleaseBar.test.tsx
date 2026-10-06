import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { ReleaseBar } from './ReleaseBar';

describe('ReleaseBar', () => {
  it('says what the newest release is and leads to its page', async () => {
    await renderWithRoutes(ReleaseBar);

    const newest = CHANGELOG[0];
    const link = await screen.findByRole('link', { name: /New release/ });

    expect(link).toHaveTextContent(newest?.version ?? '');
    expect(link).toHaveAttribute('href', `/changelog/${newest?.slug ?? ''}`);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReleaseBar.displayName).toBe('ReleaseBar');
  });
});
