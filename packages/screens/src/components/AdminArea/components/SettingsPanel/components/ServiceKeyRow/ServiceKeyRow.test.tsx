import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ServiceKeyRow } from './ServiceKeyRow';

const notified = vi.hoisted(() => ({ worked: vi.fn(), failed: vi.fn() }));

vi.mock('@ValenceUI/notify', () => ({ notify: notified }));

const props = {
  title: 'OMDb',
  about: 'Rotten Tomatoes scores.',
  description: 'Adds scores.',
  done: 'OMDb key saved.',
  failed: 'The OMDb key could not be saved.',
  onSaved: () => undefined,
};

describe('ServiceKeyRow', () => {
  it('says whether a key is saved, and offers to add one where none is', () => {
    render(<ServiceKeyRow {...props} isSet={false} save={() => Promise.resolve(true)} />);

    expect(screen.getByText('No key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add key' })).toBeInTheDocument();
  });

  it('saves a pasted key and says so', async () => {
    const user = userEvent.setup();
    const save = vi.fn(() => Promise.resolve(true));
    const onSaved = vi.fn();

    render(
      <ServiceKeyRow
        {...props}
        isSet
        freeKeyAt="https://example.com/key"
        save={save}
        onSaved={onSaved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change key' }));

    expect(screen.getByRole('button', { name: 'Get a free key' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('OMDb key'), ' abc123 ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(save).toHaveBeenCalledWith('abc123');
    expect(notified.worked).toHaveBeenCalledWith('OMDb key saved.');
    expect(onSaved).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Change key' })).toBeInTheDocument();
  });

  it('keeps the field open and says why where the key could not be saved', async () => {
    const user = userEvent.setup();

    render(<ServiceKeyRow {...props} isSet={false} save={() => Promise.resolve(false)} />);

    await user.click(screen.getByRole('button', { name: 'Add key' }));
    await user.type(screen.getByLabelText('OMDb key'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(notified.failed).toHaveBeenCalledWith('The OMDb key could not be saved.');
    expect(screen.getByLabelText('OMDb key')).toBeInTheDocument();
  });
});
