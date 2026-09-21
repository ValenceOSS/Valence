import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DrawnCell } from './DrawnCell';

describe('DrawnCell', () => {
  it('draws whatever it is given to draw', () => {
    render(<DrawnCell draw={() => <span>Severance</span>} />);

    expect(screen.getByText('Severance')).toBeInTheDocument();
  });

  it('draws nothing where there is nothing to draw', () => {
    const { container } = render(<DrawnCell draw={() => null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps what it drew as the drawing changes', () => {
    const { rerender } = render(<DrawnCell draw={() => <button type="button">one</button>} />);

    const before = screen.getByRole('button');

    rerender(<DrawnCell draw={() => <button type="button">two</button>} />);

    expect(screen.getByRole('button')).toBe(before);
    expect(before).toHaveTextContent('two');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DrawnCell.displayName).toBe('DrawnCell');
  });
});
