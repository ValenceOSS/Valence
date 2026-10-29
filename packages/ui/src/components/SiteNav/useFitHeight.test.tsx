import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFitHeight } from './useFitHeight';

let resized: (() => void) | null = null;

/**
 * Shows the height the hook measured, beside the content it measured.
 *
 * @param props - The text to measure.
 * @param props.text - What the content says.
 */
const Measured = ({ text }: { text: string }) => {
  const { measureRef, height } = useFitHeight();

  return (
    <>
      <div ref={measureRef}>{text}</div>
      <output>{height === null ? 'unmeasured' : height.toString()}</output>
    </>
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  resized = null;
});

const stubContentHeight = (height: number): void => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => height,
  });
};

describe('useFitHeight', () => {
  it('measures how tall the content is, rounding up to a whole pixel', () => {
    stubContentHeight(240.4);

    render(<Measured text="Product" />);

    expect(screen.getByRole('status')).toHaveTextContent('241');
  });

  it('measures nothing until something is attached', () => {
    const Unattached = () => {
      const { height } = useFitHeight();

      return <output>{height === null ? 'unmeasured' : height.toString()}</output>;
    };

    render(<Unattached />);

    expect(screen.getByRole('status')).toHaveTextContent('unmeasured');
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
    stubContentHeight(200);

    render(<Measured text="Resources" />);

    expect(screen.getByRole('status')).toHaveTextContent('200');

    stubContentHeight(320);
    act(() => {
      resized?.();
    });

    expect(screen.getByRole('status')).toHaveTextContent('320');
  });
});
