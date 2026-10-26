import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PluginsPicture } from './PluginsPicture';

describe('PluginsPicture', () => {
  it('says what a plugin may do before it is installed', () => {
    render(<PluginsPicture />);

    expect(screen.getByText('Install Lyrics?')).toBeInTheDocument();
    expect(screen.getByText('Read your library')).toBeInTheDocument();
  });

  it('holds back installing a plugin nobody vouches for until its risk is understood', () => {
    render(<PluginsPicture />);

    expect(screen.getByRole('button', { name: 'Install anyway' })).toBeDisabled();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('lets it be installed anyway once its risk is understood', () => {
    render(<PluginsPicture isUnderstood />);

    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Install anyway' })).toBeEnabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginsPicture.displayName).toBe('PluginsPicture');
  });
});
