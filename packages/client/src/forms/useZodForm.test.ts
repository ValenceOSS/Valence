import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useZodForm } from './useZodForm';

const Schema = z.object({
  name: z.string().trim().min(1, { error: 'Give it a name.' }),
  port: z.string().regex(/^\d+$/, { error: 'A whole number.' }).transform(Number),
});

const EMPTY = { name: '', port: '80' };

describe('useZodForm', () => {
  it('says nothing is wrong before anything has been changed or sent', () => {
    const { result } = renderHook(() => useZodForm(Schema, EMPTY, vi.fn()));

    expect(result.current.isValid).toBe(false);
    expect(result.current.errorOf('name')).toBeUndefined();
    expect(result.current.text('name').error).toBeUndefined();
  });

  it('says what is wrong with a field once it has been changed', () => {
    const { result } = renderHook(() => useZodForm(Schema, EMPTY, vi.fn()));

    act(() => {
      result.current.text('port').onValueChange('eighty');
    });

    expect(result.current.errorOf('port')).toBe('A whole number.');
    expect(result.current.errorOf('name')).toBeUndefined();
  });

  it('says what is wrong with every field once a send has been tried, and does not send', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useZodForm(Schema, EMPTY, onSubmit));

    act(() => {
      result.current.submit();
    });

    expect(result.current.errorOf('name')).toBe('Give it a name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends the answers as the schema reads them once they parse', async () => {
    const onSubmit = vi.fn(() => null);
    const { result } = renderHook(() => useZodForm(Schema, EMPTY, onSubmit));

    act(() => {
      result.current.assign({ name: '  Sonarr ', port: '8989' });
    });

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { name: 'Sonarr', port: 8989 },
        { reset: result.current.reset },
      );
    });
  });

  it('shows why the answers were refused, in the words it was given', async () => {
    const { result } = renderHook(() =>
      useZodForm(Schema, { name: 'Sonarr', port: '8989' }, () => 'That name is taken.'),
    );

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.problem).toBe('That name is taken.');
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('says it could not be saved where sending fails outright', async () => {
    const { result } = renderHook(() =>
      useZodForm(Schema, { name: 'Sonarr', port: '8989' }, () => Promise.reject(new Error('down'))),
    );

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.problem).not.toBeNull();
    });
  });

  it('is emptied again by the reset it hands its sender, saying nothing is wrong', async () => {
    const { result } = renderHook(() =>
      useZodForm(Schema, { name: 'Sonarr', port: '8989' }, (_answers, { reset }) => {
        reset(EMPTY);

        return null;
      }),
    );

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.values).toEqual(EMPTY);
    });
    expect(result.current.errorOf('name')).toBeUndefined();
  });

  it('gives back what is wrong without sending when only checked', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useZodForm(Schema, EMPTY, onSubmit));

    const checked: ReturnType<typeof result.current.check>[] = [];

    act(() => {
      checked.push(result.current.check());
    });

    expect(checked).toEqual([null]);
    expect(result.current.errorOf('name')).toBe('Give it a name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
