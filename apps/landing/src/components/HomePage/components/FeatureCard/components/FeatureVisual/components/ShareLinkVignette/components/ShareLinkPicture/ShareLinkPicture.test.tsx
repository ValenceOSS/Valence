import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShareLinkPicture } from './ShareLinkPicture';

describe('ShareLinkPicture', () => {
  it('shares one title by a link that needs no account', () => {
    render(<ShareLinkPicture />);

    expect(
      screen.getAllByText('Anyone with the link can watch. No account needed.')[0],
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShareLinkPicture.displayName).toBe('ShareLinkPicture');
  });
});
