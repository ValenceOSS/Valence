import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useElementWidth } from './useElementWidth';

type Callback = (entries: { contentRect: { width: number } }[]) => void;

const Probe = () => {
  const { ref, width } = useElementWidth<HTMLDivElement>();

  return <div ref={ref}>{width === null ? 'unmeasured' : width.toString()}</div>;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useElementWidth', () => {
  it('says nothing has been measured where the browser cannot watch sizes', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    render(<Probe />);

    expect(screen.getByText('unmeasured')).toBeInTheDocument();
  });

  it('follows the width as it changes', () => {
    let notify: Callback = () => {};
    const disconnect = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: Callback) {
          notify = callback;
        }

        observe() {}

        disconnect = disconnect;
      },
    );

    const { unmount } = render(<Probe />);

    act(() => {
      notify([{ contentRect: { width: 412 } }]);
    });

    expect(screen.getByText('412')).toBeInTheDocument();

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
