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

  it('shows an option that cannot be taken, and does not let it be picked', async () => {
    const onChoose = vi.fn();

    render(
      <ChoiceList
        label="Size"
        choices={[...SIZES, { id: '720p', title: '720p', aside: '704 MB', isDisabled: true }]}
        value="original"
        onChoose={onChoose}
      />,
    );

    const disabled = screen.getByRole('radio', { name: /720p/ });

    expect(disabled).toBeDisabled();

    await userEvent.click(disabled);

    expect(onChoose).not.toHaveBeenCalled();
  });

  describe('as tiles', () => {
    it('still reads out as radio buttons, with the picked one checked', () => {
      render(
        <ChoiceList label="Size" choices={SIZES} value="1080p" onChoose={vi.fn()} look="tiles" />,
      );

      expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /1080p/ })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /Original/ })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('shows what each one is about, and leaves out what tiles do not carry', () => {
      render(
        <ChoiceList label="Size" choices={SIZES} value={null} onChoose={vi.fn()} look="tiles" />,
      );

      expect(screen.getByText('Exactly what is on the server.')).toBeInTheDocument();
      expect(screen.queryByText('20 GB')).toBeNull();
      expect(screen.queryByText('Converted')).toBeNull();
    });

    it('says which tile was pressed', async () => {
      const onChoose = vi.fn();

      render(
        <ChoiceList label="Size" choices={SIZES} value="1080p" onChoose={onChoose} look="tiles" />,
      );
      await userEvent.setup().click(screen.getByRole('radio', { name: /Original/ }));

      expect(onChoose).toHaveBeenCalledWith('original');
    });

    it('does not let a tile that cannot be taken be picked', async () => {
      const onChoose = vi.fn();

      render(
        <ChoiceList
          label="Size"
          choices={[...SIZES, { id: '720p', title: '720p', isDisabled: true }]}
          value="original"
          onChoose={onChoose}
          look="tiles"
          className="mt-4"
        />,
      );

      const disabled = screen.getByRole('radio', { name: /720p/ });

      expect(disabled).toBeDisabled();
      expect(screen.getByRole('radiogroup')).toHaveClass('mt-4');

      await userEvent.click(disabled);

      expect(onChoose).not.toHaveBeenCalled();
    });
  });
});
