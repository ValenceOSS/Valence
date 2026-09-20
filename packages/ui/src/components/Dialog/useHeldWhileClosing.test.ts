import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useHeldWhileClosing } from './useHeldWhileClosing';

describe('useHeldWhileClosing', () => {
  it('follows the content while the dialog is open', () => {
    const { result, rerender } = renderHook(
      ({ content, isOpen }) => useHeldWhileClosing(content, isOpen),
      { initialProps: { content: 'first', isOpen: true } },
    );

    rerender({ content: 'second', isOpen: true });

    expect(result.current).toBe('second');
  });

  it('keeps what was last shown once the dialog closes, even as the content is cleared', () => {
    const initialProps: { content: string | null; isOpen: boolean } = {
      content: 'the request',
      isOpen: true,
    };

    const { result, rerender } = renderHook(
      ({ content, isOpen }) => useHeldWhileClosing(content, isOpen),
      { initialProps },
    );

    rerender({ content: null, isOpen: false });

    expect(result.current).toBe('the request');
  });

  it('shows the new content when the dialog opens again', () => {
    const { result, rerender } = renderHook(
      ({ content, isOpen }) => useHeldWhileClosing(content, isOpen),
      { initialProps: { content: 'first', isOpen: true } },
    );

    rerender({ content: 'first', isOpen: false });
    rerender({ content: 'another', isOpen: true });

    expect(result.current).toBe('another');
  });
});
