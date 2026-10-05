import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PluginsPicture } from './PluginsPicture';

describe('PluginsPicture', () => {
  it('asks for what a plugin may do before it can do it', () => {
    render(<PluginsPicture />);

    expect(screen.getAllByText('Subtitle Finder asks to')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginsPicture.displayName).toBe('PluginsPicture');
  });
});
