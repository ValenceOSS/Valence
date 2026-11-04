import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomHeadersCard } from './CustomHeadersCard';
import type { CustomWebhookHeader } from '@ValenceContracts/schemas/Webhook';

const SECRET: CustomWebhookHeader = { name: 'Authorization', value: '', isSecret: true };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const drawn = (saved: CustomWebhookHeader[]) => {
  const onSave = vi.fn().mockResolvedValue(true);

  render(<CustomHeadersCard saved={saved} onSave={onSave} />);

  return onSave;
};

describe('CustomHeadersCard', () => {
  it('says there are none yet', () => {
    drawn([]);

    expect(screen.getByText(/None yet/)).toBeInTheDocument();
  });

  it('shows a hidden value that is saved as dots rather than empty', () => {
    drawn([SECRET]);

    expect(screen.getByLabelText('Value')).toHaveAttribute('placeholder', '••••••••');
  });

  it('saves a moment after typing stops', async () => {
    const onSave = drawn([{ name: 'X-Token', value: 'a', isSecret: false }]);

    fireEvent.change(screen.getByRole('textbox', { name: 'Value' }), { target: { value: 'abc' } });

    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(onSave).toHaveBeenCalledWith([{ name: 'X-Token', value: 'abc', isSecret: false }]);
  });

  it('saves nothing while a header has no name or could not be sent, so none is dropped', async () => {
    const onSave = drawn([{ name: 'X-Token', value: 'a', isSecret: false }]);

    fireEvent.click(screen.getByRole('button', { name: 'Add header' }));
    fireEvent.change(screen.getAllByLabelText('Value')[0] ?? document.body, {
      target: { value: 'abc' },
    });
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Name' })[0] ?? document.body, {
      target: { value: 'X-Token:' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('says why a header could not be sent', () => {
    drawn([{ name: 'X-Token', value: 'a', isSecret: false }]);

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'X-Token:' },
    });

    expect(screen.getByText(/can’t be one Valence sets itself/)).toBeInTheDocument();
  });

  it('removes a header', async () => {
    const onSave = drawn([{ name: 'X-Token', value: 'a', isSecret: false }]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove this header' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(onSave).toHaveBeenCalledWith([]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CustomHeadersCard.displayName).toBe('CustomHeadersCard');
  });
});
