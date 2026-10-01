import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { FieldMenu } from './FieldMenu';

describe('FieldMenu', () => {
  it('says what is chosen, or that nothing is, and hands back what is picked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const options = [
      { id: '/movies', label: '/movies' },
      { id: '/films', label: '/films' },
    ];
    const { rerender } = renderInAnAddress(
      <FieldMenu
        label="Root folder"
        options={options}
        selectedId=""
        placeholder="Choose one"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Choose one')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Root folder|Choose one/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: '/films' }));

    expect(onSelect).toHaveBeenCalledWith('/films');

    rerender(
      <FieldMenu
        label="Root folder"
        options={options}
        selectedId="/movies"
        placeholder="Choose one"
        onSelect={onSelect}
      />,
    );

    expect(screen.getAllByText('/movies').length).toBeGreaterThan(0);
  });
});
