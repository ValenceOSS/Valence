import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SourceRow } from './SourceRow';

const props = {
  title: 'SubDL',
  description: 'Searched alongside OpenSubtitles.',
  freeKeyAt: 'https://example.com',
  fields: <span>The key field</span>,
  isSaving: false,
  onCancel: () => undefined,
};

describe('SourceRow', () => {
  it('opens its fields beneath it, and closes them once saved', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => Promise.resolve(true));

    render(<SourceRow {...props} isSet={false} canSave onSave={onSave} />);

    expect(screen.getByText('No key')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set up' }));

    expect(screen.getByText('The key field')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalled();
    expect(screen.queryByText('The key field')).toBeNull();
  });

  it('says a key is set and offers to change it', () => {
    render(<SourceRow {...props} isSet canSave={false} onSave={() => Promise.resolve(true)} />);

    expect(screen.getByText('Key set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });
});
