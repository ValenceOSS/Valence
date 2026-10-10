import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScopedField } from './ScopedField';

const KINDS = [
  { id: 'film', label: 'Films' },
  { id: 'series', label: 'Series' },
];

describe('ScopedField', () => {
  it('takes what is typed, and shows the kind in force at its end', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ScopedField
        label="Search"
        value=""
        onValueChange={onValueChange}
        choices={[{ label: 'Type', options: KINDS, value: 'film', onChange: vi.fn() }]}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'd');

    expect(onValueChange).toHaveBeenCalledWith('d');
    expect(screen.getByRole('button', { name: 'Type' })).toHaveTextContent('Films');
  });

  it('says which kind was chosen from each choice at its end', async () => {
    const onKind = vi.fn();
    const onLanguage = vi.fn();
    const user = userEvent.setup();

    render(
      <ScopedField
        label="Search"
        value=""
        onValueChange={vi.fn()}
        choices={[
          { label: 'Type', options: KINDS, value: 'film', onChange: onKind },
          {
            label: 'Language',
            options: [
              { id: '', label: 'Any language' },
              { id: 'fr', label: 'French' },
            ],
            value: '',
            onChange: onLanguage,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'French' }));

    expect(onLanguage).toHaveBeenCalledWith('fr');
    expect(onKind).not.toHaveBeenCalled();
  });

  it('stands alone, rounded at both ends, where there is nothing to choose', () => {
    render(<ScopedField label="Search" value="" onValueChange={vi.fn()} choices={[]} />);

    expect(screen.getByRole('searchbox', { name: 'Search' })).not.toHaveClass('rounded-r-none');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScopedField.displayName).toBe('ScopedField');
  });
});
