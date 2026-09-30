import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiBuiltOn } from './UiBuiltOn';

const DOC = {
  name: 'DataTable',
  summary: '',
  props: [],
  inherits: [],
  builtOn: [
    { name: 'TanStack Table', url: 'https://tanstack.com/table/latest/docs/api/core/table' },
    { name: 'Motion', url: 'https://motion.dev/docs/react-motion-component' },
  ],
};

describe('UiBuiltOn', () => {
  it('links each library it is built on to its documentation, in a new tab', () => {
    render(<UiBuiltOn doc={DOC} />);

    const table = screen.getByRole('link', { name: 'TanStack Table' });

    expect(table).toHaveAttribute('href', 'https://tanstack.com/table/latest/docs/api/core/table');
    expect(table).toHaveAttribute('target', '_blank');
    expect(table).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Motion' })).toBeInTheDocument();
  });

  it('says props pass through where the component inherits them', () => {
    render(<UiBuiltOn doc={{ ...DOC, inherits: ['DialogProps'] }} />);

    expect(screen.getByText(/pass through/)).toBeInTheDocument();
  });

  it('says nothing for a component built only on the platform', () => {
    const { container } = render(<UiBuiltOn doc={{ ...DOC, builtOn: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(UiBuiltOn.displayName).toBe('UiBuiltOn');
  });
});
