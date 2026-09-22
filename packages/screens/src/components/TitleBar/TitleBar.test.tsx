import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TitleBar } from './TitleBar';

describe('TitleBar', () => {
  it('says what the window is', () => {
    render(<TitleBar title="Valence" />);

    expect(screen.getByText('Valence')).toBeInTheDocument();
  });

  it('offers nothing to press, leaving the controls to the system', () => {
    render(<TitleBar title="Valence" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('takes hold of the window, which is what a frameless one needs', () => {
    const { container } = render(<TitleBar title="Valence" />);

    expect(container.querySelector('[data-slot="title-bar"]')).toHaveClass(
      '[-webkit-app-region:drag]',
    );
  });
});
