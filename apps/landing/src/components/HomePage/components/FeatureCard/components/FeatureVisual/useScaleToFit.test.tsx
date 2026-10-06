import { render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useScaleToFit } from './useScaleToFit';

/**
 * Shows the scale the hook works out for a box of content inside a frame.
 */
const Fitted = () => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const scale = useScaleToFit(frameRef, contentRef);

  return (
    <div ref={frameRef} data-testid="frame">
      <div ref={contentRef} data-testid="content" />
      <output>{scale.toString()}</output>
    </div>
  );
};

const sizes = (frame: [number, number], content: [number, number]): void => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.testid === 'frame' ? frame[0] : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.testid === 'frame' ? frame[1] : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.testid === 'content' ? content[0] : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.testid === 'content' ? content[1] : 0;
    },
  });
};

afterEach(() => {
  for (const name of ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']) {
    Reflect.deleteProperty(HTMLElement.prototype, name);
  }
});

describe('useScaleToFit', () => {
  it('shrinks content taller than its frame until it fits', () => {
    sizes([400, 200], [300, 400]);
    render(<Fitted />);

    expect(screen.getByRole('status')).toHaveTextContent('0.5');
  });

  it('never grows content that already fits', () => {
    sizes([400, 400], [100, 100]);
    render(<Fitted />);

    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});
