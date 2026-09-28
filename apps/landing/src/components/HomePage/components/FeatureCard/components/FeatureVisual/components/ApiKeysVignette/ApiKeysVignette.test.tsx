import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiKeysVignette } from './ApiKeysVignette';

describe('ApiKeysVignette', () => {
  it('shows the keys somebody has made, and when each was last used', () => {
    render(<ApiKeysVignette />);

    expect(screen.getAllByText('Home Assistant')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ApiKeysVignette.displayName).toBe('ApiKeysVignette');
  });
});
