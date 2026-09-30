import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiComponentView } from './UiComponentView';

const DOC = {
  name: 'Chip',
  summary: 'A small label.',
  props: [],
  inherits: [],
  builtOn: [
    { name: 'Radix Tooltip', url: 'https://www.radix-ui.com/primitives/docs/components/tooltip' },
  ],
};

describe('UiComponentView', () => {
  it('shows the name, summary and each example live', () => {
    render(
      <UiComponentView
        doc={DOC}
        group="Feedback"
        examples={[{ title: 'Loud', render: () => <span>A loud chip</span> }]}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Chip' })).toBeInTheDocument();
    expect(screen.getByText('A small label.')).toBeInTheDocument();
    expect(screen.getByText('Loud')).toBeInTheDocument();
    expect(screen.getByText('A loud chip')).toBeInTheDocument();
  });

  it('links the library it is built on', () => {
    render(<UiComponentView doc={DOC} group="Feedback" examples={[]} />);

    expect(screen.getByRole('link', { name: 'Radix Tooltip' })).toHaveAttribute(
      'href',
      'https://www.radix-ui.com/primitives/docs/components/tooltip',
    );
  });

  it('is named for people who cannot see it', () => {
    expect(UiComponentView.displayName).toBe('UiComponentView');
  });
});
