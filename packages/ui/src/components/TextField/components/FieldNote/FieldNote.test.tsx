import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FieldNote } from './FieldNote';

let resized: (() => void) | null = null;
let disconnected = false;

const stubResizeObserver = (): void => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(report: () => void) {
        resized = report;
      }

      observe(): void {
        return undefined;
      }

      unobserve(): void {
        return undefined;
      }

      disconnect(): void {
        disconnected = true;
      }
    },
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  resized = null;
  disconnected = false;
});

describe('FieldNote', () => {
  it('says what is wanted, under the id the field is described by', () => {
    render(<FieldNote id="note">At least eight characters</FieldNote>);

    const note = screen.getByText('At least eight characters');

    expect(note).toHaveAttribute('id', 'note');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('puts what is wrong in its place and announces it', () => {
    render(
      <FieldNote id="note" error="Too short">
        At least eight characters
      </FieldNote>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'note');
    expect(screen.queryByText('At least eight characters')).toBeNull();
  });

  it('says nothing where nothing is wanted or wrong', () => {
    const { container } = render(<FieldNote id="note" />);

    expect(container).toHaveTextContent('');
    expect(container.querySelector('#note')).toBeNull();
  });

  it('follows the size of what it says, and stops watching when it goes', () => {
    stubResizeObserver();

    const { unmount } = render(<FieldNote id="note">At least eight characters</FieldNote>);

    act(() => {
      resized?.();
    });

    expect(screen.getByText('At least eight characters')).toBeInTheDocument();

    unmount();

    expect(disconnected).toBe(true);
  });

  it('still says what is wanted where the size cannot be watched', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    render(<FieldNote id="note">At least eight characters</FieldNote>);

    expect(screen.getByText('At least eight characters')).toBeInTheDocument();
  });
});
