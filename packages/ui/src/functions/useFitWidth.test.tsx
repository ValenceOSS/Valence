import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFitWidth } from './useFitWidth';

let resized: (() => void) | null = null;

/**
 * Shows the width the hook measured, beside the content it measured.
 *
 * @param props - The text to measure.
 * @param props.text - What the content says.
 */
const Measured = ({ text }: { text: string }) => {
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const width = useFitWidth(contentRef);

  return (
    <>
      <span ref={contentRef}>{text}</span>
      <output>{width === null ? 'unmeasured' : width.toString()}</output>
    </>
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
  resized = null;
});

const stubContentWidth = (width: number): void => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => width,
  });
};

describe('useFitWidth', () => {
  it('measures what the content wants, rounding up to a whole pixel', () => {
    stubContentWidth(120.2);

    render(<Measured text="Marques" />);

    expect(screen.getByRole('status')).toHaveTextContent('121');
  });

  it('measures again when the content changes size', () => {
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
          return undefined;
        }
      },
    );
    stubContentWidth(80);

    render(<Measured text="Ada" />);

    expect(screen.getByRole('status')).toHaveTextContent('80');

    stubContentWidth(140);
    act(() => {
      resized?.();
    });

    expect(screen.getByRole('status')).toHaveTextContent('140');
  });
});
