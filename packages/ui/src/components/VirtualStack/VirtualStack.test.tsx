import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualStack } from './VirtualStack';

describe('VirtualStack', () => {
  it('draws the first blocks before anything has been measured', () => {
    render(
      <VirtualStack count={3} keyOf={(at) => `row-${at.toString()}`} estimatedHeight={300}>
        {(at) => <p>{`Row ${(at + 1).toString()}`}</p>}
      </VirtualStack>,
    );

    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 3')).toBeInTheDocument();
  });

  it('keeps room for every block, so the scrollbar says how much there is', () => {
    const { container } = render(
      <VirtualStack count={100} keyOf={(at) => `row-${at.toString()}`} estimatedHeight={300}>
        {(at) => <p>{`Row ${(at + 1).toString()}`}</p>}
      </VirtualStack>,
    );

    expect(container.querySelector('[style*="height"]')).not.toBeNull();
  });

  it('draws nothing where there is nothing to draw', () => {
    render(
      <VirtualStack count={0} keyOf={(at) => at.toString()} estimatedHeight={300}>
        {() => <p>a row</p>}
      </VirtualStack>,
    );

    expect(screen.queryByText('a row')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VirtualStack.displayName).toBe('VirtualStack');
  });
});
