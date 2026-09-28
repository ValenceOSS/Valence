import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflineVignette } from './OfflineVignette';

describe('OfflineVignette', () => {
  it('offers a quality to download against its size', () => {
    render(<OfflineVignette />);

    expect(screen.getAllByText('Data saver')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OfflineVignette.displayName).toBe('OfflineVignette');
  });
});
