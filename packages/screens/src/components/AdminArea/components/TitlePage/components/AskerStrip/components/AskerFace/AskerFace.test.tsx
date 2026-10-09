import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AskerFace } from './AskerFace';

describe('AskerFace', () => {
  it('draws the initial of somebody with no account here', () => {
    render(<AskerFace asker={{ id: 'seerr-7', name: 'kit' }} accounts={[]} size="sm" />);

    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AskerFace.displayName).toBe('AskerFace');
  });
});
