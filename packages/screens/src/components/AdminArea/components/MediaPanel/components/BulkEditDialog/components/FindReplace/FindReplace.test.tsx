import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FindReplace } from './FindReplace';

describe('FindReplace', () => {
  it('asks for what was typed, and for nothing once the words to find are emptied', async () => {
    const onReplace = vi.fn();
    const user = userEvent.setup();

    render(
      <FindReplace
        fields={['overview', 'genres']}
        kind="film"
        replace={null}
        onReplace={onReplace}
      />,
    );

    await user.type(screen.getByLabelText('Find'), 'a');
    await user.click(screen.getByRole('checkbox', { name: 'Match case' }));

    expect(onReplace).toHaveBeenLastCalledWith({
      field: 'overview',
      find: 'a',
      with: '',
      matchCase: true,
    });

    await user.clear(screen.getByLabelText('Find'));

    expect(onReplace).toHaveBeenLastCalledWith(null);
  });
});
