import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArrPathMappingsForm } from './ArrPathMappingsForm';

const MAPPINGS = [{ from: '/movies', to: '/media/Films' }];

describe('ArrPathMappingsForm', () => {
  it('changes a mapping as it is typed', async () => {
    const onChange = vi.fn();

    render(<ArrPathMappingsForm mappings={MAPPINGS} isDisabled={false} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Folder as the apps see it'), 's');

    expect(onChange).toHaveBeenLastCalledWith([{ from: '/moviess', to: '/media/Films' }]);
  });

  it('adds and removes mappings', async () => {
    const onChange = vi.fn();

    render(<ArrPathMappingsForm mappings={MAPPINGS} isDisabled={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a mapping' }));

    expect(onChange).toHaveBeenLastCalledWith([...MAPPINGS, { from: '', to: '' }]);

    await userEvent.click(screen.getByRole('button', { name: 'Remove this mapping' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
