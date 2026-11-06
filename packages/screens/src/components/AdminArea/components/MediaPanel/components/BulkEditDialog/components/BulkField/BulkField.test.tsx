import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BulkField } from './BulkField';

describe('BulkField', () => {
  it('adds words to a list, or takes them away, as chosen', async () => {
    const onTouch = vi.fn();
    const user = userEvent.setup();

    render(
      <BulkField
        field="tags"
        kind="film"
        state={{ value: ['old'], isMixed: false, titles: 2 }}
        touch={{ kind: 'words', how: 'add', words: ['new'] }}
        onTouch={onTouch}
        region="GB"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onTouch).toHaveBeenCalledWith({ kind: 'words', how: 'remove', words: ['new'] });
  });

  it('empties, puts back or fills in the sort title from each title', async () => {
    const onTouch = vi.fn();
    const user = userEvent.setup();

    render(
      <BulkField
        field="sortTitle"
        kind="film"
        state={{ value: null, isMixed: true, titles: 2 }}
        touch={undefined}
        onTouch={onTouch}
        region="GB"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'More for Sort title' }));
    await user.click(await screen.findByRole('menuitem', { name: 'From title' }));

    expect(onTouch).toHaveBeenCalledWith({ kind: 'fromTitle' });
  });

  it('says what is to happen to a field emptied on every title', () => {
    render(
      <BulkField
        field="overview"
        kind="film"
        state={{ value: 'x', isMixed: false, titles: 2 }}
        touch={{ kind: 'clear' }}
        onTouch={vi.fn()}
        region="GB"
      />,
    );

    expect(screen.getByText('Emptied on every title')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BulkField.displayName).toBe('BulkField');
  });
});
