import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MockPanel } from './MockPanel';

describe('MockPanel', () => {
  it('titles the panel and draws what is on its face', () => {
    render(
      <MockPanel title="Webhooks" actions={<span>History</span>}>
        <p>Delivered</p>
      </MockPanel>,
    );

    expect(screen.getByRole('heading', { name: 'Webhooks' })).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MockPanel.displayName).toBe('MockPanel');
  });
});
