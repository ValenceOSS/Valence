import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OriginMark } from './OriginMark';

describe('OriginMark', () => {
  it('draws the server’s initial in its colour, named for anybody who cannot see it', () => {
    render(<OriginMark initial="F" colour="#e8503a" ink="light" label="From Films" />);

    const mark = screen.getByRole('img', { name: 'From Films' });

    expect(mark).toHaveTextContent('F');
    expect(mark).toHaveStyle({ backgroundColor: '#e8503a' });
    expect(mark).toHaveClass('text-letter-light');
  });

  it('writes in dark ink on a light colour', () => {
    render(<OriginMark initial="F" colour="#f5e663" ink="dark" label="From Films" />);

    expect(screen.getByRole('img', { name: 'From Films' })).toHaveClass('text-letter-dark');
  });
});
