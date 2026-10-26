import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PluginsVignette } from './PluginsVignette';

describe('PluginsVignette', () => {
  it('asks for what a plugin may do before it can do it', () => {
    render(<PluginsVignette />);

    expect(screen.getByText('Install Lyrics?')).toBeInTheDocument();
    expect(screen.getByText('Read your library')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginsVignette.displayName).toBe('PluginsVignette');
  });
});
