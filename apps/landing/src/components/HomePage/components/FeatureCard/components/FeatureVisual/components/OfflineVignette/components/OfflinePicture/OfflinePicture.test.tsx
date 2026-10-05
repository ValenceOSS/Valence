import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflinePicture } from './OfflinePicture';

describe('OfflinePicture', () => {
  it('offers a quality to download against its size', () => {
    render(<OfflinePicture />);

    expect(screen.getAllByText('Data saver')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OfflinePicture.displayName).toBe('OfflinePicture');
  });
});
