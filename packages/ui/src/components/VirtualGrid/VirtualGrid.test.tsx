import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualGrid } from './VirtualGrid';

describe('VirtualGrid', () => {
  it('draws the things it is asked for, under the label it is given', () => {
    render(
      <VirtualGrid count={3} label="What is here" leastCardWidth={170} rowHeight={300}>
        {(at) => <p key={at}>{`Card ${(at + 1).toString()}`}</p>}
      </VirtualGrid>,
    );

    expect(screen.getByLabelText('What is here')).toBeInTheDocument();
    expect(screen.getByText('Card 1')).toBeInTheDocument();
  });

  it('draws nothing at all where there is nothing to draw', () => {
    render(
      <VirtualGrid count={0} leastCardWidth={170} rowHeight={300}>
        {(at) => <p key={at}>a card</p>}
      </VirtualGrid>,
    );

    expect(screen.queryByText('a card')).not.toBeInTheDocument();
  });

  it('keeps room for every row, so the scrollbar says how much there is', () => {
    const { container } = render(
      <VirtualGrid count={40} leastCardWidth={170} rowHeight={300}>
        {(at) => <p key={at}>{`Card ${at.toString()}`}</p>}
      </VirtualGrid>,
    );

    expect(container.querySelector('[style*="height"]')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VirtualGrid.displayName).toBe('VirtualGrid');
  });
});
