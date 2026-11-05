import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WordRow } from './WordRow';

describe('WordRow', () => {
  it('renames only once the name is changed, and on Enter', async () => {
    const onRename = vi.fn();
    const user = userEvent.setup();

    render(
      <WordRow word="Drama" count={2} isBusy={false} onRename={onRename} onRemove={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();

    await user.type(screen.getByLabelText('Rename Drama'), 's{Enter}');

    expect(onRename).toHaveBeenCalledWith('Dramas');
  });
});
