import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ServerFace } from './ServerFace';

describe('ServerFace', () => {
  it('draws a server with no picture by its initial', () => {
    render(<ServerFace name="Dummy" colour="#3a8ee8" picture={null} />);

    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ServerFace.displayName).toBe('ServerFace');
  });
});
