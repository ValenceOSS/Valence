import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflinePicture } from './OfflinePicture';

describe('OfflinePicture', () => {
  it('offers the sizes a film can be downloaded in', () => {
    render(<OfflinePicture />);

    expect(screen.getByText('720p')).toBeInTheDocument();
    expect(screen.getByText('1080p')).toBeInTheDocument();
  });

  it('says the chosen size fits on this device', () => {
    render(<OfflinePicture chosen="720p" />);

    expect(screen.getByText(/and this device has/u)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OfflinePicture.displayName).toBe('OfflinePicture');
  });
});
