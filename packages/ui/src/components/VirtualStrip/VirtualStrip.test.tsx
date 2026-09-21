import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VirtualStrip } from './VirtualStrip';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 600 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 400 });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
});

describe('VirtualStrip', () => {
  it('draws the things near the top, under the label it is given', () => {
    render(
      <VirtualStrip label="Pages" count={200} estimateSize={500}>
        {(at) => <p key={at}>{`Page ${(at + 1).toString()}`}</p>}
      </VirtualStrip>,
    );

    expect(screen.getByLabelText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('holds only the few near the screen rather than all of them', () => {
    render(
      <VirtualStrip label="Pages" count={200} estimateSize={500}>
        {(at) => <p key={at}>{`Page ${(at + 1).toString()}`}</p>}
      </VirtualStrip>,
    );

    expect(screen.queryByText('Page 150')).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Page \d+$/).length).toBeLessThan(20);
  });

  it('keeps room for every one, so the scrollbar says how much there is', () => {
    const { container } = render(
      <VirtualStrip label="Pages" count={200} estimateSize={500}>
        {(at) => <p key={at}>{at}</p>}
      </VirtualStrip>,
    );

    const total = container.querySelector<HTMLElement>('div[style*="height"]');

    expect(Number.parseInt(total?.style.height ?? '0', 10)).toBeGreaterThan(20_000);
  });

  it('says which one is across the middle of the screen', () => {
    const onIndexChange = vi.fn();

    render(
      <VirtualStrip label="Pages" count={20} estimateSize={500} onIndexChange={onIndexChange}>
        {(at) => <p key={at}>{at}</p>}
      </VirtualStrip>,
    );

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('draws what follows the last at the foot', () => {
    render(
      <VirtualStrip label="Pages" count={2} estimateSize={100} footer={<p>The foot</p>}>
        {(at) => <p key={at}>{at}</p>}
      </VirtualStrip>,
    );

    expect(screen.getByText('The foot')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VirtualStrip.displayName).toBe('VirtualStrip');
  });
});
