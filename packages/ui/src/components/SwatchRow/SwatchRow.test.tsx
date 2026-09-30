import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SwatchRow } from './SwatchRow';

const SWATCHES = [
  { id: '#ffffff', label: 'White' },
  { id: '#ffe14d', label: 'Yellow' },
];

describe('SwatchRow', () => {
  it('names the row by what the colour is for', () => {
    render(
      <SwatchRow label="Text colour" swatches={SWATCHES} value="#ffffff" onSelect={vi.fn()} />,
    );

    expect(screen.getByRole('group', { name: 'Text colour' })).toBeInTheDocument();
  });

  it('says each colour by name', () => {
    render(
      <SwatchRow label="Text colour" swatches={SWATCHES} value="#ffffff" onSelect={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yellow' })).toBeInTheDocument();
  });

  it('marks the colour in force as pressed and rings it', () => {
    render(
      <SwatchRow label="Text colour" swatches={SWATCHES} value="#ffe14d" onSelect={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Yellow' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Yellow' })).toHaveClass('outline-text');
    expect(screen.getByRole('button', { name: 'White' })).toHaveClass('outline-transparent');
  });

  it('paints each dot its own colour', () => {
    render(
      <SwatchRow label="Text colour" swatches={SWATCHES} value="#ffffff" onSelect={vi.fn()} />,
    );

    const dot = screen.getByRole('button', { name: 'Yellow' }).querySelector('span[aria-hidden]');

    expect(dot).toHaveStyle({ backgroundColor: '#ffe14d' });
  });

  it('tells which colour was pressed', async () => {
    const onSelect = vi.fn();

    render(
      <SwatchRow label="Text colour" swatches={SWATCHES} value="#ffffff" onSelect={onSelect} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Yellow' }));

    expect(onSelect).toHaveBeenCalledWith('#ffe14d');
  });
});
