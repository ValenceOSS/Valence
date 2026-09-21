import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SeasonPicker } from './SeasonPicker';

const seasonsUpTo = (last: number) =>
  Array.from({ length: last }, (_, at) => ({ seasonNumber: at + 1, isHeld: true }));

describe('SeasonPicker', () => {
  it('lays a few seasons out as one track and tells the one pressed', async () => {
    const onChange = vi.fn();

    render(<SeasonPicker seasons={seasonsUpTo(4)} value={1} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Season 3' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('turns to a menu once there are more seasons than fit across', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SeasonPicker seasons={seasonsUpTo(10)} value={2} onChange={onChange} />);

    expect(screen.queryByRole('button', { name: 'Season 9' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Which season' }));
    await user.click(await screen.findByRole('menuitemradio', { name: /Season 9/ }));

    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('says which season is being read on the menu itself', () => {
    render(<SeasonPicker seasons={seasonsUpTo(10)} value={7} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Which season' })).toHaveTextContent('Season 7');
  });

  it('says a season the library does not hold is not held', async () => {
    const user = userEvent.setup();

    render(
      <SeasonPicker
        seasons={[...seasonsUpTo(9), { seasonNumber: 10, isHeld: false }]}
        value={1}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Which season' }));

    expect(await screen.findByText('Not in your library')).toBeInTheDocument();
  });

  it('names the specials by their own name, and chooses them as null', async () => {
    const onChange = vi.fn();

    render(
      <SeasonPicker
        seasons={[{ seasonNumber: null, isHeld: true }, ...seasonsUpTo(2)]}
        value={1}
        onChange={onChange}
      />,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Other' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonPicker.displayName).toBe('SeasonPicker');
  });
});
