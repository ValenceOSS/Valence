import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CustomFormats } from './CustomFormats';
import type { FormatDraft } from './CustomFormats.types';

const HDR: FormatDraft = {
  name: 'HDR',
  score: '500',
  conditions: [{ kind: 'hdr', value: 'hdr10', isNegated: false, isRequired: false }],
};

describe('CustomFormats', () => {
  it('says so where there are no formats, and adds one', async () => {
    const onChange = vi.fn();

    render(<CustomFormats formats={[]} onChange={onChange} />);

    expect(screen.getByText(/No custom formats yet/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add a format' }));

    expect(onChange).toHaveBeenCalledWith([
      {
        name: '',
        score: '0',
        conditions: [{ kind: 'words', value: '', isNegated: false, isRequired: false }],
      },
    ]);
  });

  it('changes a format’s name and score, and adds and removes conditions', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<CustomFormats formats={[HDR]} onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Format name' }), '!');

    expect(onChange).toHaveBeenLastCalledWith([{ ...HDR, name: 'HDR!' }]);

    await user.click(screen.getByRole('button', { name: 'Add a condition' }));

    expect(onChange).toHaveBeenLastCalledWith([
      {
        ...HDR,
        conditions: [
          ...HDR.conditions,
          { kind: 'words', value: '', isNegated: false, isRequired: false },
        ],
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove this condition' }));

    expect(onChange).toHaveBeenLastCalledWith([{ ...HDR, conditions: [] }]);
  });

  it('turns a condition round, or makes it required', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<CustomFormats formats={[HDR]} onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: 'Doesn’t match' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { ...HDR, conditions: [{ ...HDR.conditions[0], isNegated: true }] },
    ]);

    await user.click(screen.getByRole('switch', { name: 'Required' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { ...HDR, conditions: [{ ...HDR.conditions[0], isRequired: true }] },
    ]);
  });

  it('removes a format by its name', async () => {
    const onChange = vi.fn();

    render(<CustomFormats formats={[HDR]} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove HDR' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CustomFormats.displayName).toBe('CustomFormats');
  });
});
