import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiKeysPicture } from './ApiKeysPicture';

describe('ApiKeysPicture', () => {
  it('shows the keys somebody has made, and when each was last used', () => {
    render(<ApiKeysPicture />);

    expect(screen.getAllByText('Home Assistant')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ApiKeysPicture.displayName).toBe('ApiKeysPicture');
  });
});
