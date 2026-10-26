import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiKeysPicture } from './ApiKeysPicture';

describe('ApiKeysPicture', () => {
  it('shows the keys somebody has made, and when each was last used', () => {
    render(<ApiKeysPicture />);

    expect(screen.getByText('Home Assistant')).toBeInTheDocument();
    expect(screen.getByText('Backup script')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Discord bot')).toBeInTheDocument();
    expect(screen.queryByText('vk_Hn4r8TzQ2mWc07bdLxCo')).toBeNull();
  });

  it('makes the new key and shows it in full, once, when acted out', () => {
    render(<ApiKeysPicture isActed />);

    expect(screen.getByText('vk_Hn4r8TzQ2mWc07bdLxCo')).toBeInTheDocument();
    expect(screen.getByText('Discord bot')).toBeInTheDocument();
  });

  it('says the new key was copied once it is', () => {
    render(<ApiKeysPicture isActed isCopied />);

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('says nothing was copied before there is a key to copy', () => {
    render(<ApiKeysPicture isCopied />);

    expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ApiKeysPicture.displayName).toBe('ApiKeysPicture');
  });
});
