import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectField } from './SelectField';

const OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'tls', label: 'TLS' },
];

describe('SelectField', () => {
  it('says what it is above the choice, and shows the one taken', () => {
    render(<SelectField label="Security" options={OPTIONS} value="tls" onSelect={vi.fn()} />);

    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Security' })).toHaveTextContent('TLS');
  });

  it('shows its placeholder where nothing it offers is taken', () => {
    render(
      <SelectField
        label="Library"
        options={OPTIONS}
        value=""
        placeholder="Choose a library"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Library' })).toHaveTextContent('Choose a library');
  });

  it('is told the choice somebody makes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<SelectField label="Security" options={OPTIONS} value="none" onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Security' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'TLS' }));

    expect(onSelect).toHaveBeenCalledWith('tls');
  });

  it('says what it is for and what is wrong with it, where it is told', () => {
    render(
      <SelectField
        label="Interval"
        description="How often it runs."
        error="Choose how often."
        options={OPTIONS}
        value="none"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('How often it runs.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose how often.');
  });

  it('keeps its name for a screen reader while hiding it from sight', () => {
    render(
      <SelectField
        label="Which requests"
        isLabelHidden
        options={OPTIONS}
        value="none"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Which requests')).toHaveClass('sr-only');
    expect(screen.getByRole('button', { name: 'Which requests' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SelectField.displayName).toBe('SelectField');
  });
});
