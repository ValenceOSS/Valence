import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConversionReasons } from './ConversionReasons';

describe('ConversionReasons', () => {
  it('names why plays were converted', () => {
    render(<ConversionReasons reasons={[{ code: 'AudioCodecNotSupported', plays: 3 }]} />);

    expect(screen.getByText('The device can’t play the sound format')).toBeInTheDocument();
  });

  it('says every play went as the file lies when none was converted', () => {
    render(<ConversionReasons reasons={[]} />);

    expect(screen.getByText('Every play went as the file lies.')).toBeInTheDocument();
  });
});
