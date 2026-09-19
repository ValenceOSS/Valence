import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Choice } from './Choice';

const options = [
  { id: 'hevc', label: 'HEVC', detail: 'About half the size of H.264.' },
  { id: 'h264', label: 'H.264', detail: 'Played by everything.' },
];

describe('Choice', () => {
  it('says what is being decided', () => {
    render(<Choice label="Codec" options={options} value="hevc" onSelect={vi.fn()} />);

    expect(screen.getByText('Codec')).toBeVisible();
  });

  it('shows the answer in force rather than its identifier', () => {
    render(<Choice label="Codec" options={options} value="hevc" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Codec' })).toHaveTextContent('HEVC');
  });

  it('hands back what was chosen', async () => {
    const onSelect = vi.fn();

    render(<Choice label="Codec" options={options} value="hevc" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Codec' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /^H\.264/ }));

    expect(onSelect).toHaveBeenCalledWith('h264');
  });

  it('marks the answer in force as the one selected', async () => {
    render(<Choice label="Codec" options={options} value="hevc" onSelect={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Codec' }));

    expect(screen.getByRole('menuitemradio', { name: /^HEVC/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('says nothing where the value matches no option, rather than showing a blank name', () => {
    render(<Choice label="Codec" options={options} value="av1" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Codec' })).toBeVisible();
  });
});
