import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChoiceList } from './ChoiceList';

const SIZES = [
  { id: 'original', title: 'Original', detail: 'Exactly what is on the server.', aside: '20 GB' },
  { id: '1080p', title: '1080p', note: 'Converted', aside: '3.2 GB' },
];

describe('ChoiceList', () => {
  it('reads out as a set of radio buttons, with the picked one checked', () => {
    render(<ChoiceList label="Size" choices={SIZES} value="1080p" onChoose={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /1080p/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Original/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('shows what each one is, what it notes and what sets it apart', () => {
    render(<ChoiceList label="Size" choices={SIZES} value={null} onChoose={vi.fn()} />);

    expect(screen.getByText('Exactly what is on the server.')).toBeInTheDocument();
    expect(screen.getByText('Converted')).toBeInTheDocument();
    expect(screen.getByText('20 GB')).toBeInTheDocument();
  });

  it('says which row was pressed', async () => {
    const onChoose = vi.fn();

    render(<ChoiceList label="Size" choices={SIZES} value="1080p" onChoose={onChoose} />);
    await userEvent.setup().click(screen.getByRole('radio', { name: /Original/ }));

    expect(onChoose).toHaveBeenCalledWith('original');
  });
});
