import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShareLinkVignette } from './ShareLinkVignette';

describe('ShareLinkVignette', () => {
  it('shares one title by a link that needs no account', () => {
    render(<ShareLinkVignette />);

    expect(screen.getAllByText('A week')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShareLinkVignette.displayName).toBe('ShareLinkVignette');
  });
});
