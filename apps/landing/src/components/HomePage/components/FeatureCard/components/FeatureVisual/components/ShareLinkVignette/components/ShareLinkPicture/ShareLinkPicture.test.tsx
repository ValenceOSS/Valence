import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShareLinkPicture } from './ShareLinkPicture';

describe('ShareLinkPicture', () => {
  it('shows the link the app made, lasting a week', () => {
    render(<ShareLinkPicture />);

    expect(screen.getByLabelText('Share link')).toHaveValue('https://watch.home.lan/s/k3Fz9QwL');
    expect(screen.getByText('A week')).toBeInTheDocument();
  });

  it('offers to copy the link until it is copied', () => {
    render(<ShareLinkPicture />);

    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('says the link was copied', () => {
    render(<ShareLinkPicture isCopied />);

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShareLinkPicture.displayName).toBe('ShareLinkPicture');
  });
});
